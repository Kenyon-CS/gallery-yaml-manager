import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SERVER_ROOT = path.resolve(__dirname, '..', '..');
export const DATA_DIR = path.join(SERVER_ROOT, 'data');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');
export const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');

export const ART_FILE = path.join(DATA_DIR, 'art.yaml');
export const GALLERY_FILE = path.join(DATA_DIR, 'gallery.yaml');
export const SCORING_FILE = path.join(DATA_DIR, 'scoring.yaml');
export const SHOW_FILE = path.join(DATA_DIR, 'show.yaml');