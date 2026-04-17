// server/src/services/artworkService.js
import { ART_FILE } from '../utils/filePaths.js';
import { readYamlFile, writeYamlFile } from './yamlFileService.js';
import { getActiveFile, resolveDataFilePath } from './projectService.js';

function toNumber(value, fieldName) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid numeric value for ${fieldName}`);
  }
  return num;
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeLockedPosition(input) {
  if (!input) {
    return { x_ft: null, y_ft: null };
  }

  return {
    x_ft: input.x_ft === '' || input.x_ft == null ? null : Number(input.x_ft),
    y_ft: input.y_ft === '' || input.y_ft == null ? null : Number(input.y_ft)
  };
}

function validateRequiredString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }
}

function buildArtworkPayload(payload, existing = null) {
  validateRequiredString(payload.id ?? existing?.id, 'id');
  validateRequiredString(payload.title, 'title');
  validateRequiredString(payload.artist, 'artist');
  validateRequiredString(payload.period, 'period');
  validateRequiredString(payload.medium, 'medium');
  validateRequiredString(payload.primary_theme, 'primary_theme');

  const result = {
    id: String(payload.id ?? existing?.id).trim(),
    title: String(payload.title).trim(),
    artist: String(payload.artist).trim(),
    year: toNumber(payload.year, 'year'),
    period: String(payload.period).trim(),
    medium: String(payload.medium).trim(),
    width_ft: toNumber(payload.width_ft, 'width_ft'),
    height_ft: toNumber(payload.height_ft, 'height_ft'),
    orientation: payload.orientation ? String(payload.orientation).trim() : '',
    image_url: payload.image_url ? String(payload.image_url).trim() : '',
    source_url: payload.source_url ? String(payload.source_url).trim() : '',
    primary_theme: String(payload.primary_theme).trim(),
    theme_tags: normalizeArray(payload.theme_tags),
    visual_intensity: toNumber(payload.visual_intensity ?? 0.5, 'visual_intensity'),
    focal_weight: toNumber(payload.focal_weight ?? 0.5, 'focal_weight'),
    palette_tags: normalizeArray(payload.palette_tags),
    mood_tags: normalizeArray(payload.mood_tags),
    eligible: Boolean(payload.eligible),
    required: Boolean(payload.required),
    locked: Boolean(payload.locked),
    locked_position: normalizeLockedPosition(
      payload.locked_position ?? {
        x_ft: payload.locked_x_ft,
        y_ft: payload.locked_y_ft
      }
    ),
    notes: payload.notes ? String(payload.notes) : ''
  };

  if (result.visual_intensity < 0 || result.visual_intensity > 1) {
    throw new Error('visual_intensity must be between 0 and 1');
  }

  if (result.focal_weight < 0 || result.focal_weight > 1) {
    throw new Error('focal_weight must be between 0 and 1');
  }

  return result;
}

async function getArtFilePath(user) {
  const filename = await getActiveFile(user, 'art');
  return resolveDataFilePath(user, filename);
}

async function loadArtData(user) {
  const filePath = await getArtFilePath(user);
  const data = await readYamlFile(filePath);

  if (!data?.art) {
    throw new Error('art.yaml is missing top-level "art" object.');
  }

  if (!Array.isArray(data.art.artworks)) {
    throw new Error('art.yaml is missing art.artworks.');
  }

  if (!data.art.controlled_vocabularies) {
    data.art.controlled_vocabularies = {};
  }

  return data;
}

async function saveArtData(user, data) {
  const filePath = await getArtFilePath(user);
  await writeYamlFile(filePath, data);
}

export async function listArtworks(user, filters = {}) {
  const data = await loadArtData(user);
  let artworks = data.art.artworks;

  const search = (filters.search || '').toLowerCase().trim();
  const period = (filters.period || '').trim();
  const theme = (filters.theme || '').trim();
  const artist = (filters.artist || '').trim();

  if (search) {
    artworks = artworks.filter((artwork) => {
      const haystack = [
        artwork.title,
        artwork.artist,
        artwork.id,
        artwork.primary_theme,
        ...(artwork.theme_tags || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }

  if (period) {
    artworks = artworks.filter((artwork) => artwork.period === period);
  }

  if (theme) {
    artworks = artworks.filter(
      (artwork) =>
        artwork.primary_theme === theme ||
        (artwork.theme_tags || []).includes(theme)
    );
  }

  if (artist) {
    artworks = artworks.filter((artwork) => artwork.artist === artist);
  }

  return artworks;
}

export async function getArtworkById(user, id) {
  const data = await loadArtData(user);
  return data.art.artworks.find((artwork) => artwork.id === id) || null;
}

export async function getVocabularies(user) {
  const data = await loadArtData(user);
  const vocabularies = data.art.controlled_vocabularies || {};
  const artworks = data.art.artworks || [];

  const artists = [...new Set(
    artworks
      .map((artwork) => artwork.artist)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  )];

  return {
    ...vocabularies,
    artists
  };
}

export async function createArtwork(user, payload) {
  const data = await loadArtData(user);
  const artworks = data.art.artworks;

  const artwork = buildArtworkPayload(payload);

  if (artworks.some((item) => item.id === artwork.id)) {
    throw new Error(`Artwork with id "${artwork.id}" already exists`);
  }

  artworks.push(artwork);
  await saveArtData(data);
  return artwork;
}

export async function updateArtwork(user, id, payload) {
  const data = await loadArtData(user);
  const artworks = data.art.artworks;
  const index = artworks.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error(`Artwork "${id}" not found`);
  }

  const existing = artworks[index];
  const updated = buildArtworkPayload({ ...payload, id }, existing);

  artworks[index] = updated;
  await saveArtData(user, data);
  return updated;
}