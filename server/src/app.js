// server/src/app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import uploadsRouter from './routes/uploads.js';
import artRoutes from './routes/art.js';
import dataRoutes from './routes/data.js';
import galleryRoutes from './routes/gallery.js';

import { clientDistDir, uploadsDir } from './utils/paths.js';
import scoringSettingsRouter from './routes/scoringSettings.js';
import showYamlRoutes from './routes/showYaml.js';
import projectRoutes from './routes/projects.js';
import authRoutes from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploaded files
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/uploads', uploadsRouter);
app.use('/api/art', artRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/scoring-settings', scoringSettingsRouter);
app.use('/api/show', showYamlRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);

// Built React frontend
app.use(express.static(clientDistDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDistDir, 'index.html'));
});

export default app;