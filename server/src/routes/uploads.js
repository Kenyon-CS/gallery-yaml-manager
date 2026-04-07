import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadsDir } from '../utils/paths.js';

const router = express.Router();

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeBase = file.originalname
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image';
    const extension = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${safeBase}${extension}`);
  }
});

const upload = multer({ storage });

router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  return res.json({
    fileName: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

export default router;
