import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchArtwork } from '../api.js';

export default function ArtworkDetailPage() {
  const { id } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArtwork(id).then(setArtwork).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="notice error">{error}</div>;
  if (!artwork) return <div className="notice">Loading artwork...</div>;

  return (
    <div className="stack-lg">
      <section className="detail-layout card">
        <div className="detail-image-box">
          {artwork.image_url ? <img src={artwork.image_url} alt={artwork.title} className="detail-image" /> : <div className="card-image placeholder">No image</div>}
        </div>
        <div className="detail-body">
          <h1>{artwork.title}</h1>
          <p><strong>ID:</strong> {artwork.id}</p>
          <p><strong>Artist:</strong> {artwork.artist}</p>
          <p><strong>Year:</strong> {artwork.year}</p>
          <p><strong>Period:</strong> {artwork.period}</p>
          <p><strong>Medium:</strong> {artwork.medium}</p>
          <p><strong>Dimensions:</strong> {artwork.width_ft} ft × {artwork.height_ft} ft ({artwork.orientation})</p>
          <p><strong>Primary theme:</strong> {artwork.primary_theme}</p>
          <p><strong>Visual intensity:</strong> {artwork.visual_intensity}</p>
          <p><strong>Focal weight:</strong> {artwork.focal_weight}</p>
          <p><strong>Eligible:</strong> {String(artwork.eligible)}</p>
          <p><strong>Required:</strong> {String(artwork.required)}</p>
          <p><strong>Locked:</strong> {String(artwork.locked)}</p>
          <p><strong>Source URL:</strong> {artwork.source_url ? <a href={artwork.source_url} target="_blank" rel="noreferrer">Open source</a> : 'None'}</p>
          <p><strong>Notes:</strong> {artwork.notes || 'None'}</p>

          <div className="detail-tags">
            <div>
              <strong>Theme tags:</strong>
              <div className="tag-line">{(artwork.theme_tags || []).map((tag) => <span key={tag} className="mini-tag">{tag}</span>)}</div>
            </div>
            <div>
              <strong>Palette tags:</strong>
              <div className="tag-line">{(artwork.palette_tags || []).map((tag) => <span key={tag} className="mini-tag">{tag}</span>)}</div>
            </div>
            <div>
              <strong>Mood tags:</strong>
              <div className="tag-line">{(artwork.mood_tags || []).map((tag) => <span key={tag} className="mini-tag">{tag}</span>)}</div>
            </div>
          </div>

          <div className="card-actions">
            <Link to={`/artworks/${artwork.id}/edit`} className="button">Edit Artwork</Link>
            <Link to="/" className="button secondary">Back to List</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
