import express from 'express';
import { getAllData, getResolvedArrangement } from '../services/dataService.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const data = await getAllData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/resolved-arrangements/:id', async (req, res) => {
  try {
    const data = await getResolvedArrangement(req.params.id);
    res.json(data);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

export default router;