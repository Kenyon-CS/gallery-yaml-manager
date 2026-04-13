import { readYamlFile, writeYamlFile } from './yamlFileService.js';
import { getActiveFile, resolveDataFilePath } from './projectService.js';

async function getScoringFilePath() {
  const filename = await getActiveFile('scoring');
  return resolveDataFilePath(filename);
}

export async function loadScoringData() {
  const filePath = await getScoringFilePath();
  console.log('[SCORING FILE]', filePath);
  const parsed = await readYamlFile(filePath);

  if (!parsed?.scoring) {
    throw new Error('scoring.yaml is missing scoring.');
  }

  return parsed;
}

export async function saveScoringData(data) {
  if (!data?.scoring) {
    throw new Error('Submitted data is missing scoring.');
  }

  const filePath = await getScoringFilePath();

  await writeYamlFile(filePath, data, { backup: true });
  return data;
}