import express from 'express';
import {
  listProjects,
  createProject,
  getProjectByFilename,
  getCurrentProject,
  getCurrentProjectFilename,
  setCurrentProject,
  updateProjectActive,
  createProjectFile,
} from '../services/projectService.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const projects = await listProjects();
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const project = await createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/current', async (_req, res) => {
  try {
    const filename = await getCurrentProjectFilename();
    const project = await getCurrentProject();
    res.json({ filename, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/current', async (req, res) => {
  try {
    const result = await setCurrentProject(req.body.filename);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:filename', async (req, res) => {
  try {
    const project = await getProjectByFilename(req.params.filename);
    res.json(project);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.put('/:filename/active', async (req, res) => {
  try {
    const project = await updateProjectActive(req.params.filename, req.body || {});
    res.json(project);
  } catch (error) {
    const status = error.message.includes('not listed') ? 400 : 404;
    res.status(status).json({ error: error.message });
  }
});

router.post('/:filename/files', async (req, res) => {
  try {
    const result = await createProjectFile(req.params.filename, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;