import fs from 'fs/promises';
import yaml from 'js-yaml';

import { getActiveFile, resolveDataFilePath } from './projectService.js';

async function getShowFilePath() {
  const filename = await getActiveFile('show');
  return resolveDataFilePath(filename);
}

export async function loadShowData() {
  const filePath = await getShowFilePath();
  console.log('[LOAD SHOW]', filePath);

  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = yaml.load(raw);

  if (!parsed?.show) {
    throw new Error('show.yaml is missing top-level show object.');
  }

  parsed.show.arrangements ??= [];
  return parsed;
}

export async function backupShowYaml() {
  const filePath = await getShowFilePath();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.${timestamp}.bak`;

  const content = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(backupPath, content, 'utf8');

  return backupPath;
}

export async function saveShowData(data) {
  const filePath = await getShowFilePath();

  const dumped = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });

  await fs.writeFile(filePath, dumped, 'utf8');
}