// client/src/pages/ArtworkListPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { fetchArtworks, fetchVocabularies } from '../api.js';
import ArtworkCard from '../components/ArtworkCard.jsx';

export default function ArtworkListPage() {
  const [filters, setFilters] = useState({ search: '', period: '', theme: '', artist: '' });
  const [result, setResult] = useState({ artworks: [], metadata: null });
  const [vocabularies, setVocabularies] = useState({ periods: [], theme_tags: [], artists: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVocabularies();
  }, []);

  useEffect(() => {
    loadArtworks();
  }, [filters]);

  async function loadVocabularies() {
    try {
      const data = await fetchVocabularies();
      setVocabularies({
        periods: data.periods || [],
        theme_tags: data.theme_tags || [],
        artists: data.artists || [],
        media: data.media || [],
        palette_tags: data.palette_tags || [],
        mood_tags: data.mood_tags || []
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadArtworks() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchArtworks(filters);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const uniqueArtworks = useMemo(() => {
    const seenIds = new Set();
    const rawArtworks = result.artworks || [];

    return rawArtworks.filter((artwork) => {
      const id = String(artwork?.id || '').trim();
      if (!id) return false;
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });
  }, [result.artworks]);

  return (
    <div className="stack-lg">
      <section className="hero card">
        <h1>Artwork Browser</h1>
        <p>Search, inspect, and edit artworks stored in the active art file.</p>
      </section>

      <section className="card">
        <div className="form-grid four-col">
          <div className="field-block">
            <label className="field-label">Search</label>
            <input
              className="text-input"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="title, artist, id, theme..."
            />
          </div>
          <div className="field-block">
            <label className="field-label">Period</label>
            <select
              className="text-input"
              value={filters.period}
              onChange={(e) => updateFilter('period', e.target.value)}
            >
              <option value="">All periods</option>
              {vocabularies.periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <label className="field-label">Theme</label>
            <select
              className="text-input"
              value={filters.theme}
              onChange={(e) => updateFilter('theme', e.target.value)}
            >
              <option value="">All themes</option>
              {vocabularies.theme_tags.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <label className="field-label">Artist</label>
            <select
              className="text-input"
              value={filters.artist}
              onChange={(e) => updateFilter('artist', e.target.value)}
            >
              <option value="">All artists</option>
              {vocabularies.artists.map((artist) => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
          <strong>Matching artworks:</strong> {uniqueArtworks.length}
        </div>
      </section>

      {error ? <div className="notice error">{error}</div> : null}
      {loading ? <div className="notice">Loading artworks...</div> : null}

      <section className="artwork-grid">
        {uniqueArtworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </section>

      {!loading && uniqueArtworks.length === 0 ? (
        <div className="notice">No artworks match the current filters.</div>
      ) : null}
    </div>
  );
}