// server/src/routes/scoringSettings.js  
import express from 'express';
import { loadScoringData, saveScoringData } from '../services/scoringYamlService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = req.query.user;
    const data = await loadScoringData(user);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const user = req.query.user;
    const saved = await saveScoringData(user, req.body);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;