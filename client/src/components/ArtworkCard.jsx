import { Link } from 'react-router-dom';

export default function ArtworkCard({ artwork }) {
  return (
    <article className="card artwork-card">
      <div className="card-image-box">
        {artwork.image_url ? (
          <img src={artwork.image_url} alt={artwork.title} className="card-image" />
        ) : (
          <div className="card-image placeholder">No image</div>
        )}
      </div>
      <div className="card-body">
        <h3>{artwork.title}</h3>
        <p><strong>ID:</strong> {artwork.id}</p>
        <p><strong>Artist:</strong> {artwork.artist}</p>
        <p><strong>Year:</strong> {artwork.year}</p>
        <p><strong>Period:</strong> {artwork.period}</p>
        <p><strong>Theme:</strong> {artwork.primary_theme}</p>
        <div className="tag-line">
          {(artwork.theme_tags || []).map((tag) => <span key={tag} className="mini-tag">{tag}</span>)}
        </div>
        <div className="card-actions">
          <Link to={`/artworks/${artwork.id}`} className="button secondary">View</Link>
          <Link to={`/artworks/${artwork.id}/edit`} className="button">Edit</Link>
        </div>
      </div>
    </article>
  );
}
