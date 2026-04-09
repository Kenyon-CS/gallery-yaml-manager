import fs from 'fs/promises';
import yaml from 'js-yaml';
import { showYamlPath } from '../utils/paths.js';

export async function loadShowData() {
  const raw = await fs.readFile(showYamlPath, 'utf8');
  const parsed = yaml.load(raw);

  if (!parsed?.show) {
    throw new Error('show.yaml is missing top-level show object.');
  }

  parsed.show.arrangements ??= [];
  return parsed;
}

export async function backupShowYaml() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${showYamlPath}.${timestamp}.bak`;
  const content = await fs.readFile(showYamlPath, 'utf8');
  await fs.writeFile(backupPath, content, 'utf8');
  return backupPath;
}

export async function saveShowData(data) {
  const dumped = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
  await fs.writeFile(showYamlPath, dumped, 'utf8');
}