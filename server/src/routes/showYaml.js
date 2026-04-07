import express from 'express';
import { loadShowData } from '../services/yamlService.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const data = await loadShowData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
