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

router.get('/', async (req, res) => {
  try {
    const user = req.query.user;
    const gallery = await getGallery(user);
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const user = req.query.user;
    const rooms = await getRooms(user);
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rooms/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const room = await getRoomById(user, req.params.id);
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
    const user = req.query.user;
    const room = await createRoom(user, req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/rooms/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const room = await updateRoom(user, req.params.id, req.body);
    res.json(room);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.get('/doors', async (req, res) => {
  try {
    const user = req.query.user;
    const doors = await getDoors(user);
    res.json({ doors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/doors', async (req, res) => {
  try {
    const user = req.query.user;
    const door = await createDoor(user, req.body);
    res.status(201).json(door);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/doors/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const door = await updateDoor(user, req.params.id, req.body);
    res.json(door);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.delete('/doors/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const result = await deleteDoor(user, req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.get('/windows', async (req, res) => {
  try {
    const user = req.query.user;
    const windows = await getWindows(user);
    res.json({ windows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/windows', async (req, res) => {
  try {
    const user = req.query.user;
    const win = await createWindow(user, req.body);
    res.status(201).json(win);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/windows/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const win = await updateWindow(user, req.params.id, req.body);
    res.json(win);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.delete('/windows/:id', async (req, res) => {
  try {
    const user = req.query.user;
    const result = await deleteWindow(user, req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

export default router;