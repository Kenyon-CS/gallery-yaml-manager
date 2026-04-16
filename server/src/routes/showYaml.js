// server/src/routes/showYaml.js
import express from 'express';
import { loadShowData, saveShowData } from '../services/yamlService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = req.query.user;
    const data = await loadShowData(user);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const user = req.query.user;

    if (!req.body || !req.body.show) {
      return res.status(400).json({ error: 'Request body must include a show object.' });
    }

    const saved = await saveShowData(user, req.body);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;