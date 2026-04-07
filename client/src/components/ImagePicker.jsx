import { useState } from 'react';
import { uploadImage } from '../api.js';

export default function ImagePicker({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('Uploading image...');

    try {
      const result = await uploadImage(file);
      onChange(result.url);
      setMessage(`Uploaded: ${result.fileName}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="field-block">
      <label className="field-label">Image</label>
      <input
        className="text-input"
        type="text"
        value={value}
        placeholder="Paste an image URL or upload a file below"
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="upload-row">
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        {message ? <span className="helper-text">{message}</span> : null}
      </div>
      {value ? (
        <div className="image-preview-box">
          <img src={value} alt="Artwork preview" className="image-preview" />
        </div>
      ) : null}
    </div>
  );
}
