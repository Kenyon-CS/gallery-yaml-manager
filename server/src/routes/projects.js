// server/src/routes/projects.js
import express from 'express';
import multer from 'multer';

const upload = multer({ dest: 'tmp/' });

import {
  listProjects,
  createProject,
  getProjectByFilename,
  getCurrentProject,
  getCurrentProjectFilename,
  setCurrentProject,
  updateProjectActive,
  createProjectFile,
  uploadProjectFile,
  getProjectFilePath,
  cloneProjectFile,
} from '../services/projectService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = req.query.user;
    const projects = await listProjects(user);
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const user = req.query.user;
    const project = await createProject(user, req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/current', async (req, res) => {
  try {
    const user = req.query.user;
    const filename = await getCurrentProjectFilename(user);
    const project = await getCurrentProject(user);
    res.json({ filename, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/current', async (req, res) => {
  try {
    const user = req.query.user;
    const result = await setCurrentProject(user, req.body.filename);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:filename', async (req, res) => {
  try {
    const user = req.query.user;
    const project = await getProjectByFilename(user, req.params.filename);
    res.json(project);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.put('/:filename/active', async (req, res) => {
  try {
    const user = req.query.user;
    const project = await updateProjectActive(user, req.params.filename, req.body || {});
    res.json(project);
  } catch (error) {
    const status = error.message.includes('not listed') ? 400 : 404;
    res.status(status).json({ error: error.message });
  }
});

router.post('/:filename/files', async (req, res) => {
  try {
    const user = req.query.user;
    const result = await createProjectFile(user, req.params.filename, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:filename/upload/:type', upload.single('file'), async (req, res) => {
  try {
    const user = req.query.user;
    const file = req.file;
    const { type, filename: projectFilename } = req.params;
    const overwrite = String(req.body?.overwrite || 'false') === 'true';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const result = await uploadProjectFile(user, projectFilename, type, file, { overwrite });
    res.status(overwrite ? 200 : 201).json(result);
  } catch (error) {
    const status =
      error.message.includes('already exists') ? 409 :
        error.message.includes('Invalid file type') ? 400 :
          error.message.includes('not found') ? 404 :
            400;

    res.status(status).json({ error: error.message });
  }
});

router.get('/:filename/download/:type/:file', async (req, res) => {
  try {
    const user = req.query.user;
    const { filename: projectFilename, type, file } = req.params;

    const fullPath = await getProjectFilePath(user, projectFilename, type, file);

    res.download(fullPath, file);
  } catch (error) {
    const status =
      error.message.includes('Invalid file type') ? 400 :
        error.message.includes('not listed') ? 400 :
          error.message.includes('not found') ? 404 :
            400;

    res.status(status).json({ error: error.message });
  }
});

router.post('/:filename/files/clone', async (req, res) => {
  try {
    const user = req.query.user;
    const result = await cloneProjectFile(user, req.params.filename, req.body || {});
    res.status(201).json(result);
  } catch (error) {
    const status =
      error.message.includes('already exists') ? 409 :
        error.message.includes('not listed') ? 400 :
          error.message.includes('not found') ? 404 :
            error.message.includes('Invalid file type') ? 400 :
              400;

    res.status(status).json({ error: error.message });
  }
});

export default router;