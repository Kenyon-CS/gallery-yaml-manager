import express from 'express';
import path from 'path';
import artworksRouter from './routes/artworks.js';
import uploadsRouter from './routes/uploads.js';
import showYamlRouter from './routes/showYaml.js';
import { clientDistDir, uploadsDir } from './utils/paths.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));
app.use('/api/artworks', artworksRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/show-yaml', showYamlRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static(clientDistDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDistDir, 'index.html'));
});

export default app;
