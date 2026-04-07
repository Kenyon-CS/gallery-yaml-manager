import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const serverRoot = path.resolve(__dirname, '../..');
export const projectRoot = path.resolve(serverRoot, '..');
export const dataDir = path.join(serverRoot, 'data');
export const uploadsDir = path.join(serverRoot, 'uploads');
export const showYamlPath = path.join(dataDir, 'show.yaml');
export const clientDistDir = path.join(projectRoot, 'client', 'dist');
