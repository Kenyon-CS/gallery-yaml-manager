import { ART_FILE, GALLERY_FILE, SCORING_FILE, SHOW_FILE } from '../utils/filePaths.js';
import { readYamlFile } from './yamlFileService.js';

export async function getAllData() {
  const [art, gallery, scoring, show] = await Promise.all([
    readYamlFile(ART_FILE),
    readYamlFile(GALLERY_FILE),
    readYamlFile(SCORING_FILE),
    readYamlFile(SHOW_FILE)
  ]);

  return { art, gallery, scoring, show };
}

export async function getResolvedArrangement(arrangementId) {
  const { art, gallery, scoring, show } = await getAllData();

  const arrangements = show?.show?.arrangements || [];
  const arrangement = arrangements.find((item) => item.id === arrangementId);

  if (!arrangement) {
    throw new Error(`Arrangement "${arrangementId}" not found`);
  }

  const artworks = art?.art?.artworks || [];
  const spaces = gallery?.gallery?.spaces || [];

  const resolvedSpace = spaces.find((space) => space.id === arrangement.space_id) || null;

  const resolvedPlacements = (arrangement.placements || []).map((placement) => {
    const artwork = artworks.find((item) => item.id === placement.artwork_id) || null;
    return {
      ...placement,
      artwork
    };
  });

  return {
    arrangement,
    resolvedSpace,
    resolvedPlacements,
    scoringProfileId: show?.show?.scoring_profile_id || null,
    scoring
  };
}