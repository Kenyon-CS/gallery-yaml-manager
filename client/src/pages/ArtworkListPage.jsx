import { useEffect, useState } from 'react';
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
      setVocabularies(data);
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

  return (
    <div className="stack-lg">
      <section className="hero card">
        <h1>Artwork Browser</h1>
        <p>Search, inspect, and edit artworks stored in show.yaml.</p>
      </section>

      <section className="card">
        <div className="form-grid four-col">
          <div className="field-block">
            <label className="field-label">Search</label>
            <input className="text-input" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="title, artist, id, theme..." />
          </div>
          <div className="field-block">
            <label className="field-label">Period</label>
            <select className="text-input" value={filters.period} onChange={(e) => updateFilter('period', e.target.value)}>
              <option value="">All periods</option>
              {vocabularies.periods.map((period) => <option key={period} value={period}>{period}</option>)}
            </select>
          </div>
          <div className="field-block">
            <label className="field-label">Theme</label>
            <select className="text-input" value={filters.theme} onChange={(e) => updateFilter('theme', e.target.value)}>
              <option value="">All themes</option>
              {vocabularies.theme_tags.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
            </select>
          </div>
          <div className="field-block">
            <label className="field-label">Artist</label>
            <select className="text-input" value={filters.artist} onChange={(e) => updateFilter('artist', e.target.value)}>
              <option value="">All artists</option>
              {vocabularies.artists.map((artist) => <option key={artist} value={artist}>{artist}</option>)}
            </select>
          </div>
        </div>
      </section>

      {error ? <div className="notice error">{error}</div> : null}
      {loading ? <div className="notice">Loading artworks...</div> : null}

      <section className="artwork-grid">
        {result.artworks.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} />)}
      </section>

      {!loading && result.artworks.length === 0 ? <div className="notice">No artworks match the current filters.</div> : null}
    </div>
  );
}
