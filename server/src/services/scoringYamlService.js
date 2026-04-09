import path from 'path';
import { fileURLToPath } from 'url';
import { readYamlFile, writeYamlFile } from './yamlFileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/src/services → go up two → server/, then into data/
const scoringYamlPath = path.resolve(__dirname, '../../data/scoring.yaml');

export async function loadScoringData() {
  const parsed = await readYamlFile(scoringYamlPath);

  if (!parsed?.scoring) {
    throw new Error('scoring.yaml is missing scoring.');
  }

  return parsed;
}

export async function saveScoringData(data) {
  if (!data?.scoring) {
    throw new Error('Submitted data is missing scoring.');
  }

  await writeYamlFile(scoringYamlPath, data, { backup: true });
  return data;
}

