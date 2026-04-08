import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { BACKUP_DIR } from '../utils/filePaths.js';

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function readYamlFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return yaml.load(raw);
}

export async function writeYamlFile(filePath, data, { backup = true } = {}) {
  await ensureDir(path.dirname(filePath));

  if (backup) {
    try {
      const existing = await fs.readFile(filePath, 'utf8');
      await ensureDir(BACKUP_DIR);
      const backupName = `${path.basename(filePath)}.${timestampForFilename()}.bak`;
      await fs.writeFile(path.join(BACKUP_DIR, backupName), existing, 'utf8');
    } catch (error) {
      // Ignore if file doesn't exist yet
      if (error.code !== 'ENOENT') throw error;
    }
  }

  const yamlText = yaml.dump(data, {
    noRefs: true,
    lineWidth: 120,
    sortKeys: false
  });

  await fs.writeFile(filePath, yamlText, 'utf8');
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}