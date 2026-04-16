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

function extractWallsFromGallery(galleryData) {
  const walls = [];

  for (const room of galleryData?.gallery?.rooms || []) {
    for (const wall of room.walls || []) {
      if (wall?.id) {
        walls.push(wall.id);
      }
    }
  }

  return walls;
}

function buildEmptyShowFromGallery(galleryData, id, createdFiles = {}) {
  const wallIds = extractWallsFromGallery(galleryData);

  return {
    schema_version: '2.0',
    show: {
      id: `show-${id}`,
      title: `${id} Show`,
      subtitle: '',
      gallery_id: createdFiles.gallery || '',
      scoring_profile_id: createdFiles.scoring || '',
      curator: '',
      notes: '',
      wall_designs: wallIds.map((wallId) => ({
        wall_id: wallId,
        candidate_artwork_ids: []
      })),
      arrangements: []
    }
  };
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
  if (!user) throw new Error('Missing user');
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

function assertValidType(type) {
  if (!TYPE_PREFIX[type]) {
    throw new Error('Invalid file type.');
  }
}

function safeUploadedFilename(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  if (ext !== '.yaml' && ext !== '.yml') {
    throw new Error('Only .yaml or .yml files are allowed.');
  }

  const base = path.basename(originalname).replace(/\s+/g, '-');
  if (base.includes('..') || base.includes('/') || base.includes('\\')) {
    throw new Error('Invalid filename.');
  }

  return base;
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

  const createdFiles = {};

  // Copy default art, gallery, and scoring files
  for (const type of ['art', 'gallery', 'scoring']) {
    const newFilename = `${TYPE_PREFIX[type]}${id}.yaml`;
    const defaultsPath = path.join(DATA_DIR, 'defaults', `${type}.yaml`);
    const userFilePath = path.join(getUserProjectsDir(user), newFilename);

    if (await fileExists(userFilePath)) {
      throw new Error(`File "${newFilename}" already exists.`);
    }

    await fs.copyFile(defaultsPath, userFilePath);
    createdFiles[type] = newFilename;
  }

  // Generate show file from the copied gallery file
  const showFilename = `${TYPE_PREFIX.show}${id}.yaml`;
  const showPath = path.join(getUserProjectsDir(user), showFilename);

  if (await fileExists(showPath)) {
    throw new Error(`File "${showFilename}" already exists.`);
  }

  const galleryData = await readYamlFile(
    path.join(getUserProjectsDir(user), createdFiles.gallery)
  );

  const showData = buildEmptyShowFromGallery(galleryData, id, createdFiles);
  await writeYamlFile(showPath, showData, { backup: false });
  createdFiles.show = showFilename;

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
  if (!filename) return null;

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
  assertValidType(type);

  const slug = sanitizeName(name);
  if (!slug) {
    throw new Error('File name is required.');
  }

  const newFilename = `${TYPE_PREFIX[type]}${slug}.yaml`;
  const fullPath = path.join(getUserProjectsDir(user), newFilename);

  if (await fileExists(fullPath)) {
    throw new Error(`File "${newFilename}" already exists.`);
  }

  const projectData = validateProjectShape(
    await readYamlFile(projectPathFromFilename(user, filename))
  );

  if (type === 'show') {
    const activeGalleryFilename = projectData.project.active.gallery;

    if (!activeGalleryFilename) {
      throw new Error('No active gallery file is set for this project.');
    }

    const galleryPath = path.join(getUserProjectsDir(user), activeGalleryFilename);
    const galleryData = await readYamlFile(galleryPath);

    const showData = buildEmptyShowFromGallery(galleryData, slug, {
      gallery: activeGalleryFilename,
      scoring: projectData.project.active.scoring || ''
    });

    await writeYamlFile(fullPath, showData, { backup: false });
  } else {
    const defaultsPath = path.join(DATA_DIR, 'defaults', `${type}.yaml`);
    await fs.copyFile(defaultsPath, fullPath);
  }

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
export async function getProjectFilePath(user, projectFilename, type, filename) {
  assertValidType(type);

  const projectData = validateProjectShape(
    await readYamlFile(projectPathFromFilename(user, projectFilename))
  );

  if (!projectData.project.files[type].includes(filename)) {
    throw new Error(`File "${filename}" is not listed in project for type "${type}".`);
  }

  const fullPath = path.join(getUserProjectsDir(user), filename);

  if (!(await fileExists(fullPath))) {
    throw new Error(`File "${filename}" not found.`);
  }

  return fullPath;
}

export async function uploadProjectFile(user, projectFilename, type, file, { overwrite = false } = {}) {
  assertValidType(type);

  const finalName = safeUploadedFilename(file.originalname);
  const fullPath = path.join(getUserProjectsDir(user), finalName);

  const projectData = validateProjectShape(
    await readYamlFile(projectPathFromFilename(user, projectFilename))
  );

  try {
    const content = await fs.readFile(file.path, 'utf8');
    yaml.load(content);
  } catch (err) {
    await fs.unlink(file.path).catch(() => {});
    throw new Error('Invalid YAML file.');
  }

  const exists = await fileExists(fullPath);
  if (exists && !overwrite) {
    await fs.unlink(file.path).catch(() => {});
    throw new Error(`File "${finalName}" already exists.`);
  }

  await fs.mkdir(getUserProjectsDir(user), { recursive: true });
  await fs.copyFile(file.path, fullPath);
  await fs.unlink(file.path).catch(() => {});

  if (!projectData.project.files[type].includes(finalName)) {
    projectData.project.files[type].push(finalName);
  }

  if (!projectData.project.active[type]) {
    projectData.project.active[type] = finalName;
  }

  await writeYamlFile(projectPathFromFilename(user, projectFilename), projectData);

  return {
    filename: finalName,
    type,
    overwritten: exists,
  };
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

export async function cloneProjectFile(user, projectFilename, { type, sourceFilename, newName }) {
  assertValidType(type);

  const source = String(sourceFilename || '').trim();
  if (!source) {
    throw new Error('Source filename is required.');
  }

  const slug = sanitizeName(newName);
  if (!slug) {
    throw new Error('New file name is required.');
  }

  const newFilename = `${TYPE_PREFIX[type]}${slug}.yaml`;

  const projectData = validateProjectShape(
    await readYamlFile(projectPathFromFilename(user, projectFilename))
  );

  if (!projectData.project.files[type].includes(source)) {
    throw new Error(`File "${source}" is not listed in project for type "${type}".`);
  }

  const sourcePath = path.join(getUserProjectsDir(user), source);
  const destPath = path.join(getUserProjectsDir(user), newFilename);

  if (!(await fileExists(sourcePath))) {
    throw new Error(`Source file "${source}" not found.`);
  }

  if (await fileExists(destPath)) {
    throw new Error(`File "${newFilename}" already exists.`);
  }

  await fs.copyFile(sourcePath, destPath);

  if (!projectData.project.files[type].includes(newFilename)) {
    projectData.project.files[type].push(newFilename);
  }

  if (!projectData.project.active[type]) {
    projectData.project.active[type] = newFilename;
  }

  await writeYamlFile(projectPathFromFilename(user, projectFilename), projectData);

  return {
    type,
    sourceFilename: source,
    filename: newFilename,
  };
}