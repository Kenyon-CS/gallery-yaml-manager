// server/src/services/scoringYamlService.js
import { readYamlFile, writeYamlFile } from './yamlFileService.js';
import { getActiveFile, resolveDataFilePath } from './projectService.js';

async function getScoringFilePath(user) {
  const filename = await getActiveFile(user, 'scoring');
  return resolveDataFilePath(user, filename);
}

export async function loadScoringData(user) {
  const filePath = await getScoringFilePath(user);
  console.log('[SCORING FILE]', filePath);
  const parsed = await readYamlFile(filePath);

  if (!parsed?.scoring) {
    throw new Error('scoring.yaml is missing scoring.');
  }

  return parsed;
}

export async function saveScoringData(user, data) {
  if (!data?.scoring) {
    throw new Error('Submitted data is missing scoring.');
  }

  const filePath = await getScoringFilePath(user);

  await writeYamlFile(filePath, data, { backup: true });
  return data;
}