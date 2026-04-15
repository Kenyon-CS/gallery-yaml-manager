// server/src/routes/showYaml.js
import express from 'express';
import { loadShowData } from '../services/yamlService.js';

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

export default router;