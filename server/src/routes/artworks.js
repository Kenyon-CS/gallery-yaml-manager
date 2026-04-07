import express from 'express';
import { createArtwork, getArtworkById, getVocabularies, listArtworks, updateArtwork } from '../services/artworkService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await listArtworks(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/vocabularies', async (_req, res) => {
  try {
    const vocabularies = await getVocabularies();
    res.json(vocabularies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const artwork = await getArtworkById(req.params.id);
    res.json(artwork);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const artwork = await createArtwork(req.body);
    res.status(201).json(artwork);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const artwork = await updateArtwork(req.params.id, req.body);
    res.json(artwork);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

export default router;
