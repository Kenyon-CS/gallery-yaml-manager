import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchArtwork, fetchVocabularies, updateArtwork } from '../api.js';
import ArtworkForm from '../components/ArtworkForm.jsx';

export default function EditArtworkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [vocabularies, setVocabularies] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [artworkData, vocabData] = await Promise.all([fetchArtwork(id), fetchVocabularies()]);
        setArtwork(artworkData);
        setVocabularies(vocabData);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(payload) {
    setBusy(true);
    setError('');
    try {
      const updated = await updateArtwork(id, payload);
      navigate(`/artworks/${updated.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="notice error">{error}</div>;
  if (!artwork) return <div className="notice">Loading artwork...</div>;

  return (
    <div className="stack-lg">
      <section className="hero card">
        <h1>Edit Artwork</h1>
        <p>Update the record for {artwork.title}.</p>
      </section>
      <ArtworkForm initialData={artwork} vocabularies={vocabularies} submitLabel="Save Changes" onSubmit={handleSubmit} busy={busy} />
    </div>
  );
}
