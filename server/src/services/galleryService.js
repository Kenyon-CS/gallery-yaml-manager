// server/src/services/galleryService.js
import { getActiveFile, resolveDataFilePath } from './projectService.js';
import { readYamlFile, writeYamlFile } from './yamlFileService.js';

function toNumber(value, fieldName) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid numeric value for ${fieldName}`);
  }
  return num;
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

function normalizeBoolean(value) {
  return Boolean(value);
}

function loadArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

async function loadGalleryData(user) {
  const filename = await getActiveFile(user, 'gallery');
  const filePath = resolveDataFilePath(user, filename);
  console.log('[GALLERY FILE]', filename);

  const data = await readYamlFile(filePath);

  if (!data?.gallery) {
    throw new Error('gallery.yaml is missing top-level "gallery" object.');
  }

  data.gallery.rooms = loadArray(data.gallery.rooms);
  data.gallery.doors = loadArray(data.gallery.doors);
  data.gallery.windows = loadArray(data.gallery.windows);

  for (const room of data.gallery.rooms) {
    room.walls = loadArray(room.walls);
  }

  return data;
}

async function saveGalleryData(user, data) {
  const filename = await getActiveFile(user, 'gallery');
  const filePath = resolveDataFilePath(user, filename);

  await writeYamlFile(filePath, data);
}

function ensureUniqueId(items, id, itemType, excludeId = null) {
  const duplicate = items.find((item) => item.id === id && item.id !== excludeId);
  if (duplicate) {
    throw new Error(`${itemType} with id "${id}" already exists`);
  }
}

function findRoom(data, roomId) {
  return data.gallery.rooms.find((room) => room.id === roomId) || null;
}

function findWall(room, wallId) {
  return (room?.walls || []).find((wall) => wall.id === wallId) || null;
}

function validateDoorEndpoint(data, endpoint, endpointName) {
  if (!endpoint) {
    throw new Error(`${endpointName} is required`);
  }

  const roomId = requireString(endpoint.room_id, `${endpointName}.room_id`);
  const wallId = requireString(endpoint.wall_id, `${endpointName}.wall_id`);
  const offsetFt = toNumber(endpoint.offset_ft, `${endpointName}.offset_ft`);

  const room = findRoom(data, roomId);
  if (!room) {
    throw new Error(`${endpointName}.room_id "${roomId}" does not exist`);
  }

  const wall = findWall(room, wallId);
  if (!wall) {
    throw new Error(`${endpointName}.wall_id "${wallId}" does not exist in room "${roomId}"`);
  }

  if (offsetFt < 0 || offsetFt > Number(wall.length_ft)) {
    throw new Error(`${endpointName}.offset_ft must be within wall length`);
  }

  return {
    room_id: roomId,
    wall_id: wallId,
    offset_ft: offsetFt
  };
}

function normalizeWallPayload(payload, existing = null) {
  return {
    id: requireString(payload.id ?? existing?.id, 'wall.id'),
    label: requireString(payload.label ?? existing?.label ?? payload.id, 'wall.label'),
    orientation: requireString(payload.orientation, 'wall.orientation'),
    length_ft: toNumber(payload.length_ft, 'wall.length_ft'),
    height_ft: toNumber(payload.height_ft, 'wall.height_ft'),
    thickness_ft: toNumber(payload.thickness_ft ?? existing?.thickness_ft ?? 0.5, 'wall.thickness_ft'),
    displayable: normalizeBoolean(payload.displayable),
    default_hang_y_ft: toNumber(payload.default_hang_y_ft ?? existing?.default_hang_y_ft ?? 5.0, 'wall.default_hang_y_ft'),
    finish: payload.finish ? String(payload.finish).trim() : '',
    notes: payload.notes ? String(payload.notes) : ''
  };
}

function normalizeRoomPayload(payload, existing = null) {
  const walls = loadArray(payload.walls, existing?.walls || []).map((wall) => normalizeWallPayload(wall));

  const wallIds = new Set();
  for (const wall of walls) {
    if (wall.length_ft <= 0) throw new Error(`Wall "${wall.id}" length_ft must be positive`);
    if (wall.height_ft <= 0) throw new Error(`Wall "${wall.id}" height_ft must be positive`);
    if (wallIds.has(wall.id)) throw new Error(`Duplicate wall id "${wall.id}" in room`);
    wallIds.add(wall.id);
  }

  return {
    id: requireString(payload.id ?? existing?.id, 'room.id'),
    name: requireString(payload.name, 'room.name'),
    width_ft: toNumber(payload.width_ft, 'room.width_ft'),
    height_ft: toNumber(payload.height_ft, 'room.height_ft'),
    ceiling_height_ft: toNumber(payload.ceiling_height_ft, 'room.ceiling_height_ft'),
    notes: payload.notes ? String(payload.notes) : '',
    walls
  };
}

function normalizeDoorPayload(data, payload, existing = null) {
  const id = requireString(payload.id ?? existing?.id, 'door.id');
  const width_ft = toNumber(payload.width_ft, 'door.width_ft');
  const height_ft = toNumber(payload.height_ft, 'door.height_ft');

  const endpoint_a = validateDoorEndpoint(data, payload.endpoint_a ?? existing?.endpoint_a, 'endpoint_a');
  const endpoint_b = validateDoorEndpoint(data, payload.endpoint_b ?? existing?.endpoint_b, 'endpoint_b');

  return {
    id,
    name: payload.name ? String(payload.name).trim() : id,
    width_ft,
    height_ft,
    type: payload.type ? String(payload.type).trim() : 'swing',
    notes: payload.notes ? String(payload.notes) : '',
    endpoint_a,
    endpoint_b
  };
}

function normalizeWindowPayload(data, payload, existing = null) {
  const id = requireString(payload.id ?? existing?.id, 'window.id');
  const room_id = requireString(payload.room_id ?? existing?.room_id, 'window.room_id');
  const wall_id = requireString(payload.wall_id ?? existing?.wall_id, 'window.wall_id');

  const room = findRoom(data, room_id);
  if (!room) {
    throw new Error(`window.room_id "${room_id}" does not exist`);
  }

  const wall = findWall(room, wall_id);
  if (!wall) {
    throw new Error(`window.wall_id "${wall_id}" does not exist in room "${room_id}"`);
  }

  const width_ft = toNumber(payload.width_ft, 'window.width_ft');
  const height_ft = toNumber(payload.height_ft, 'window.height_ft');
  const sill_height_ft = toNumber(payload.sill_height_ft, 'window.sill_height_ft');
  const offset_ft = toNumber(payload.offset_ft, 'window.offset_ft');

  if (offset_ft < 0 || offset_ft > Number(wall.length_ft)) {
    throw new Error('window.offset_ft must be within wall length');
  }

  return {
    id,
    room_id,
    wall_id,
    name: payload.name ? String(payload.name).trim() : id,
    width_ft,
    height_ft,
    sill_height_ft,
    offset_ft,
    notes: payload.notes ? String(payload.notes) : ''
  };
}

export async function getGallery(user) {
  const data = await loadGalleryData(user);
  return data.gallery;
}

export async function getRooms(user) {
  const data = await loadGalleryData(user);
  return data.gallery.rooms;
}

export async function getRoomById(user,id) {
  const data = await loadGalleryData(user);
  return findRoom(data, id);
}

export async function createRoom(user, payload) {
  const data = await loadGalleryData(user);
  const room = normalizeRoomPayload(payload);

  ensureUniqueId(data.gallery.rooms, room.id, 'Room');
  data.gallery.rooms.push(room);

  await saveGalleryData(user, data);
  return room;
}

export async function updateRoom(user,id, payload) {
  const data = await loadGalleryData(user);
  const idx = data.gallery.rooms.findIndex((room) => room.id === id);

  if (idx === -1) {
    throw new Error(`Room "${id}" not found`);
  }

  const existing = data.gallery.rooms[idx];
  const updated = normalizeRoomPayload({ ...payload, id }, existing);

  ensureUniqueId(data.gallery.rooms, updated.id, 'Room', id);
  data.gallery.rooms[idx] = updated;

  await saveGalleryData(user, data);
  return updated;
}

export async function getDoors(user) {
  const data = await loadGalleryData(user);
  return data.gallery.doors;
}

export async function createDoor(user, payload) {
  const data = await loadGalleryData(user);
  const door = normalizeDoorPayload(data, payload);

  ensureUniqueId(data.gallery.doors, door.id, 'Door');
  data.gallery.doors.push(door);

  await saveGalleryData(user, data);
  return door;
}

export async function updateDoor(user, id, payload) {
  const data = await loadGalleryData(user);
  const idx = data.gallery.doors.findIndex((door) => door.id === id);

  if (idx === -1) {
    throw new Error(`Door "${id}" not found`);
  }

  const existing = data.gallery.doors[idx];
  const updated = normalizeDoorPayload(data, { ...payload, id }, existing);

  ensureUniqueId(data.gallery.doors, updated.id, 'Door', id);
  data.gallery.doors[idx] = updated;

  await saveGalleryData(user, data);
  return updated;
}

export async function deleteDoor(user, id) {
  const data = await loadGalleryData(user);
  const before = data.gallery.doors.length;
  data.gallery.doors = data.gallery.doors.filter((door) => door.id !== id);

  if (data.gallery.doors.length === before) {
    throw new Error(`Door "${id}" not found`);
  }

  await saveGalleryData(user, data);
  return { success: true };
}

export async function getWindows(user) {
  const data = await loadGalleryData(user);
  return data.gallery.windows;
}

export async function createWindow(user,payload) {
  const data = await loadGalleryData(user);
  const win = normalizeWindowPayload(data, payload);

  ensureUniqueId(data.gallery.windows, win.id, 'Window');
  data.gallery.windows.push(win);

  await saveGalleryData(user, data);
  return win;
}

export async function updateWindow(user,id, payload) {
  const data = await loadGalleryData(user);
  const idx = data.gallery.windows.findIndex((win) => win.id === id);

  if (idx === -1) {
    throw new Error(`Window "${id}" not found`);
  }

  const existing = data.gallery.windows[idx];
  const updated = normalizeWindowPayload(data, { ...payload, id }, existing);

  ensureUniqueId(data.gallery.windows, updated.id, 'Window', id);
  data.gallery.windows[idx] = updated;

  await saveGalleryData(user, data);
  return updated;
}

export async function deleteWindow(user, id) {
  const data = await loadGalleryData(user);
  const before = data.gallery.windows.length;

  data.gallery.windows = data.gallery.windows.filter((win) => win.id !== id);

  if (data.gallery.windows.length === before) {
    throw new Error(`Window "${id}" not found`);
  }

  await saveGalleryData(user, data);
  return { success: true };
}