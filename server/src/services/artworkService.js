import {
  detectOrientation,
  normalizeTagList,
  parseBoolean,
  parseInteger,
  parseNumber
} from '../utils/validation.js';
import { backupShowYaml, loadShowData, saveShowData } from './yamlService.js';

function normalizeArtworkPayload(payload) {
  const widthFt = parseNumber(payload.width_ft, 'width_ft');
  const heightFt = parseNumber(payload.height_ft, 'height_ft');
  const locked = parseBoolean(payload.locked);

  const artwork = {
    id: String(payload.id || '').trim(),
    title: String(payload.title || '').trim(),
    artist: String(payload.artist || '').trim(),
    year: parseInteger(payload.year, 'year'),
    period: String(payload.period || '').trim(),
    medium: String(payload.medium || '').trim(),
    width_ft: widthFt,
    height_ft: heightFt,
    orientation: String(payload.orientation || detectOrientation(widthFt, heightFt)).trim(),
    image_url: String(payload.image_url || '').trim(),
    source_url: String(payload.source_url || '').trim(),
    primary_theme: String(payload.primary_theme || '').trim(),
    theme_tags: normalizeTagList(payload.theme_tags),
    visual_intensity: parseNumber(payload.visual_intensity, 'visual_intensity'),
    focal_weight: parseNumber(payload.focal_weight, 'focal_weight'),
    palette_tags: normalizeTagList(payload.palette_tags),
    mood_tags: normalizeTagList(payload.mood_tags),
    eligible: parseBoolean(payload.eligible),
    required: parseBoolean(payload.required),
    locked,
    locked_position: {
      x_ft: locked ? parseNumber(payload.locked_x_ft, 'locked_x_ft') : null,
      y_ft: locked ? parseNumber(payload.locked_y_ft, 'locked_y_ft') : null
    },
    notes: String(payload.notes || '').trim()
  };

  if (!artwork.id) throw new Error('id is required.');
  if (!artwork.title) throw new Error('title is required.');
  if (!artwork.artist) throw new Error('artist is required.');
  if (artwork.year === null) throw new Error('year is required.');
  if (!artwork.period) throw new Error('period is required.');
  if (!artwork.medium) throw new Error('medium is required.');
  if (artwork.width_ft === null) throw new Error('width_ft is required.');
  if (artwork.height_ft === null) throw new Error('height_ft is required.');
  if (!artwork.primary_theme) throw new Error('primary_theme is required.');
  if (artwork.visual_intensity === null) throw new Error('visual_intensity is required.');
  if (artwork.focal_weight === null) throw new Error('focal_weight is required.');

  return artwork;
}

function matchesSearch(artwork, query) {
  const q = query.toLowerCase();
  return [
    artwork.id,
    artwork.title,
    artwork.artist,
    String(artwork.year),
    artwork.period,
    artwork.medium,
    artwork.primary_theme,
    ...(artwork.theme_tags || [])
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export async function listArtworks(filters = {}) {
  const data = await loadShowData();
  let artworks = data.show.artworks;

  if (filters.search) {
    artworks = artworks.filter((artwork) => matchesSearch(artwork, String(filters.search)));
  }
  if (filters.period) {
    artworks = artworks.filter((artwork) => artwork.period === filters.period);
  }
  if (filters.theme) {
    artworks = artworks.filter(
      (artwork) => artwork.primary_theme === filters.theme || (artwork.theme_tags || []).includes(filters.theme)
    );
  }
  if (filters.artist) {
    artworks = artworks.filter((artwork) => artwork.artist === filters.artist);
  }

  artworks = [...artworks].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return { metadata: data.show, artworks };
}

export async function getArtworkById(id) {
  const data = await loadShowData();
  const artwork = data.show.artworks.find((item) => item.id === id);
  if (!artwork) {
    throw new Error(`Artwork '${id}' not found.`);
  }
  return artwork;
}

export async function getVocabularies() {
  const data = await loadShowData();
  const vocab = data.show.controlled_vocabularies || {};
  const artists = [...new Set((data.show.artworks || []).map((art) => art.artist).filter(Boolean))].sort();
  return {
    theme_tags: vocab.theme_tags || [],
    periods: vocab.periods || [],
    media: vocab.media || [],
    palette_tags: vocab.palette_tags || [],
    mood_tags: vocab.mood_tags || [],
    artists
  };
}

export async function createArtwork(payload) {
  const data = await loadShowData();
  const artwork = normalizeArtworkPayload(payload);

  if (data.show.artworks.some((item) => item.id === artwork.id)) {
    throw new Error(`Artwork id '${artwork.id}' already exists.`);
  }

  data.show.artworks.push(artwork);
  await backupShowYaml();
  await saveShowData(data);
  return artwork;
}

export async function updateArtwork(id, payload) {
  const data = await loadShowData();
  const index = data.show.artworks.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Artwork '${id}' not found.`);
  }

  const artwork = normalizeArtworkPayload(payload);
  if (artwork.id !== id && data.show.artworks.some((item) => item.id === artwork.id)) {
    throw new Error(`Artwork id '${artwork.id}' already exists.`);
  }

  data.show.artworks[index] = artwork;
  await backupShowYaml();
  await saveShowData(data);
  return artwork;
}
