// server/src/routes/art.js
import express from 'express';
import {
  listArtworks,
  getArtworkById,
  getVocabularies,
  createArtwork,
  updateArtwork
} from '../services/artworkService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = req.query.user;
    const artworks = await listArtworks(user, req.query || {});
    res.json({ artworks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/vocabularies', async (req, res) => {
  try {
    const user = req.query.user;
    const vocabularies = await getVocabularies(user);
    res.json(vocabularies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const artwork = await getArtworkById(user, req.params.id);

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const user = req.query.user;
    const artwork = await createArtwork(user, req.body);
    res.status(201).json(artwork);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const artwork = await updateArtwork(user, req.params.id, req.body);
    res.json(artwork);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

export default router;