// server/src/routes/gallery.js
import express from 'express';
import {
  getGallery,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  getDoors,
  createDoor,
  updateDoor,
  deleteDoor,
  getWindows,
  createWindow,
  updateWindow,
  deleteWindow
} from '../services/galleryService.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const gallery = await getGallery();
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rooms', async (_req, res) => {
  try {
    const rooms = await getRooms();
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rooms/:id', async (req, res) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rooms', async (req, res) => {
  try {
    const room = await createRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/rooms/:id', async (req, res) => {
  try {
    const room = await updateRoom(req.params.id, req.body);
    res.json(room);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.get('/doors', async (_req, res) => {
  try {
    const doors = await getDoors();
    res.json({ doors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/doors', async (req, res) => {
  try {
    const door = await createDoor(req.body);
    res.status(201).json(door);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/doors/:id', async (req, res) => {
  try {
    const door = await updateDoor(req.params.id, req.body);
    res.json(door);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.delete('/doors/:id', async (req, res) => {
  try {
    const result = await deleteDoor(req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.get('/windows', async (_req, res) => {
  try {
    const windows = await getWindows();
    res.json({ windows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/windows', async (req, res) => {
  try {
    const win = await createWindow(req.body);
    res.status(201).json(win);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/windows/:id', async (req, res) => {
  try {
    const win = await updateWindow(req.params.id, req.body);
    res.json(win);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.delete('/windows/:id', async (req, res) => {
  try {
    const result = await deleteWindow(req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

export default router;