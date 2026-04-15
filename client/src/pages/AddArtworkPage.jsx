// client/src/pages/AddArtworkPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createArtwork, fetchVocabularies } from '../api.js';
import ArtworkForm from '../components/ArtworkForm.jsx';

export default function AddArtworkPage() {
  const navigate = useNavigate();
  const [vocabularies, setVocabularies] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchVocabularies().then(setVocabularies).catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(payload) {
    setBusy(true);
    setError('');
    try {
      const created = await createArtwork(payload);
      navigate(`/artworks/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg">
      <section className="hero card">
        <h1>Add Artwork</h1>
        <p>Create a new artwork record and save it into art.yaml.</p>
      </section>
      {error ? <div className="notice error">{error}</div> : null}
      <ArtworkForm vocabularies={vocabularies} submitLabel="Create Artwork" onSubmit={handleSubmit} busy={busy} />
    </div>
  );
}
