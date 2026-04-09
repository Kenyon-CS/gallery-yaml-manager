import express from 'express';
import { loadScoringData, saveScoringData } from '../services/scoringYamlService.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const data = await loadScoringData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const saved = await saveScoringData(req.body);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;