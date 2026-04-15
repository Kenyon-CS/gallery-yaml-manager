// server/src/services/projectService.js
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { readYamlFile, writeYamlFile, fileExists } from './yamlFileService.js';
import { DATA_DIR } from '../utils/filePaths.js';

async function readCurrentProjectFile(user) {
  const file = getUserCurrentProjectFile(user);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { project: '' };
    }
    throw error;
  }
}


const TYPE_PREFIX = {
  art: 'art-',
  gallery: 'gallery-',
  show: 'show-',
  scoring: 'scoring-',
};

const TYPE_TEMPLATES = {
  art: {
    schema_version: '2.0',
    art: {
      id: '',
      title: '',
      subtitle: '',
      curator: '',
      source_museum: '',
      notes: '',
      controlled_vocabularies: {
        theme_tags: [],
        periods: [],
        media: [],
        palette_tags: [],
        mood_tags: [],
      },
      artworks: [],
    },
  },
  gallery: {
    schema_version: '2.0',
    gallery: {
      id: '',
      name: '',
      subtitle: '',
      location: '',
      notes: '',
      rooms: [],
      doors: [],
      windows: [],
      layout_defaults: {
        min_gap_ft: 0.3,
        ideal_gap_ft: 0.55,
        max_gap_ft: 0.95,
        snap_to_grid_ft: 0.01,
        no_overlap: true,
        stay_within_space: true,
        allow_vertical_offset: false,
        allow_stacking: false,
      },
    },
  },
  show: {
    schema_version: '2.0',
    show: {
      id: '',
      title: '',
      subtitle: '',
      gallery_id: '',
      scoring_profile_id: '',
      curator: '',
      notes: '',
      arrangements: [],
    },
  },
  scoring: {
    schema_version: '2.0',
    scoring: {
      profile_id: '',
      name: '',
      description: '',
      normalization: {
        raw_metric_scale: '0_to_100',
        final_score_scale: '0_to_1',
      },
      hard_constraints: {},
      criteria: {},
      pairwise_tables: {},
      aggregation: {
        method: 'weighted_average',
        use_only_nonfailed_criteria: false,
        include_bonus_terms: false,
        include_penalty_terms: true,
      },
      adaptive_feedback: {
        enabled: false,
        allow_weight_updates: true,
        allow_threshold_updates: false,
        learning_rate: 0.15,
        max_weight_change_per_round: 0.1,
      },
    },
  },
};

function getUserDir(user) {
  if (!user) throw new Error("Missing user");
  return path.join(DATA_DIR, 'users', user);
}

function getUserProjectsDir(user) {
  return path.join(getUserDir(user), 'projects');
}

function getUserCurrentProjectFile(user) {
  return path.join(getUserDir(user), 'current-project.json');
}

function sanitizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function projectFilenameFromId(id) {
  return `project-${id}.yaml`;
}

function projectPathFromFilename(user, filename) {
  return path.join(getUserProjectsDir(user), filename);
}

function validateProjectShape(data) {
  if (!data?.project) {
    throw new Error('Project file is missing top-level project object.');
  }

  const { project } = data;
  project.files ??= {};
  project.files.art ??= [];
  project.files.gallery ??= [];
  project.files.show ??= [];
  project.files.scoring ??= [];

  project.active ??= {};
  project.active.art ??= '';
  project.active.gallery ??= '';
  project.active.show ??= '';
  project.active.scoring ??= '';

  return data;
}


export async function listProjects(user) {

  const dir = getUserProjectsDir(user);
  const entries = await fs.readdir(dir);
  const projectFiles = entries.filter((name) => /^project-.*\.ya?ml$/i.test(name)).sort();

  const projects = [];
  for (const filename of projectFiles) {
    try {
      const data = validateProjectShape(await readYamlFile(projectPathFromFilename(user, filename)));
      projects.push({
        filename,
        id: data.project.id,
        name: data.project.name,
        description: data.project.description || '',
      });
    } catch {
      projects.push({
        filename,
        id: filename.replace(/^project-/, '').replace(/\.ya?ml$/i, ''),
        name: filename,
        description: 'Could not parse project file.',
      });
    }
  }

  return projects;
}

export async function getProjectByFilename(user, filename) {
  const data = await readYamlFile(projectPathFromFilename(user, filename));
  return validateProjectShape(data);
}

export async function createProject(user, { name, description = '' }) {

  await fs.mkdir(getUserProjectsDir(user), { recursive: true });

  const id = sanitizeName(name);
  const filename = projectFilenameFromId(id);
  const fullPath = projectPathFromFilename(user, filename);

  if (await fileExists(fullPath)) {
    throw new Error(`Project "${filename}" already exists.`);
  }

  // ----------------------------
  // Create default files
  // ----------------------------

  const createdFiles = {};

  for (const type of ['art', 'gallery', 'show', 'scoring']) {
    const newFilename = `${TYPE_PREFIX[type]}${id}.yaml`;
    const defaultsPath = path.join(DATA_DIR, 'defaults', `${type}.yaml`);
    const userFilePath = path.join(getUserProjectsDir(user), newFilename);

    if (await fileExists(userFilePath)) {
      throw new Error(`File "${newFilename}" already exists.`);
    }

    await fs.copyFile(defaultsPath, userFilePath);
    createdFiles[type] = newFilename;
  }

  // ----------------------------
  // Create project file
  // ----------------------------

  const data = {
    schema_version: '2.0',
    project: {
      id,
      name: String(name).trim(),
      description: String(description || ''),

      files: {
        art: [createdFiles.art],
        gallery: [createdFiles.gallery],
        show: [createdFiles.show],
        scoring: [createdFiles.scoring],
      },

      active: {
        art: createdFiles.art,
        gallery: createdFiles.gallery,
        show: createdFiles.show,
        scoring: createdFiles.scoring,
      },
    },
  };

  await writeYamlFile(fullPath, data, { backup: false });

  return { filename, ...data.project };
}

export async function getCurrentProjectFilename(user) {
  const data = await readCurrentProjectFile(user);
  return data.project || '';
}

export async function setCurrentProject(user, filename) {
  const fullPath = projectPathFromFilename(user, filename);

  if (!(await fileExists(fullPath))) {
    throw new Error(`Project "${filename}" not found.`);
  }

  await fs.mkdir(getUserDir(user), { recursive: true });

  await fs.writeFile(
    getUserCurrentProjectFile(user),
    JSON.stringify({ project: filename }, null, 2),
    'utf8'
  );

  return { project: filename };
}

export async function getCurrentProject(user) {
  const filename = await getCurrentProjectFilename(user);
  if (!filename) {
    return null;
  }
  return {
    filename,
    ...(await getProjectByFilename(user, filename)),
  };
}

export async function updateProjectActive(user, filename, activeUpdates) {
  const fullPath = projectPathFromFilename(user, filename);
  const data = validateProjectShape(await readYamlFile(fullPath));

  for (const type of ['art', 'gallery', 'show', 'scoring']) {
    if (activeUpdates[type] === undefined) continue;

    const nextValue = String(activeUpdates[type] || '');
    if (nextValue && !data.project.files[type].includes(nextValue)) {
      throw new Error(`File "${nextValue}" is not listed in project for type "${type}".`);
    }

    data.project.active[type] = nextValue;
  }

  await writeYamlFile(fullPath, data);
  return data;
}

export async function createProjectFile(user, filename, { type, name }) {
  if (!TYPE_PREFIX[type]) {
    throw new Error('Invalid file type.');
  }

  const slug = sanitizeName(name);
  if (!slug) {
    throw new Error('File name is required.');
  }

  const newFilename = `${TYPE_PREFIX[type]}${slug}.yaml`;
  const fullPath = path.join(getUserProjectsDir(user), newFilename);

  if (await fileExists(fullPath)) {
    throw new Error(`File "${newFilename}" already exists.`);
  }

  const defaultsPath = path.join(DATA_DIR, 'defaults', `${type}.yaml`);
  await fs.copyFile(defaultsPath, fullPath);

  const projectData = validateProjectShape(await readYamlFile(projectPathFromFilename(user, filename)));
  if (!projectData.project.files[type].includes(newFilename)) {
    projectData.project.files[type].push(newFilename);
  }
  if (!projectData.project.active[type]) {
    projectData.project.active[type] = newFilename;
  }
  await fs.mkdir(getUserProjectsDir(user), { recursive: true });
  await writeYamlFile(projectPathFromFilename(user, filename), projectData);

  return { filename: newFilename, type };
}

export async function getActiveFile(user, type) {
  const current = await getCurrentProject(user);

  if (!current) {
    throw new Error('You must select or create a project.');
  }

  const filename = current.project.active[type];

  if (!filename) {
    throw new Error(`No active ${type} file set in project.`);
  }

  return filename;
}

export function resolveDataFilePath(user, filename) {
  return path.join(getUserProjectsDir(user), filename);
}