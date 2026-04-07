import { useMemo, useState } from 'react';
import ImagePicker from './ImagePicker.jsx';
import TagSelector from './TagSelector.jsx';

const emptyForm = {
  id: '',
  title: '',
  artist: '',
  year: '',
  period: '',
  medium: '',
  width_ft: '',
  height_ft: '',
  orientation: '',
  image_url: '',
  source_url: '',
  primary_theme: '',
  theme_tags: [],
  visual_intensity: '0.50',
  focal_weight: '0.50',
  palette_tags: [],
  mood_tags: [],
  eligible: true,
  required: false,
  locked: false,
  locked_x_ft: '',
  locked_y_ft: '',
  notes: ''
};

function toFormState(initialData) {
  if (!initialData) return emptyForm;
  return {
    ...emptyForm,
    ...initialData,
    year: initialData.year ?? '',
    width_ft: initialData.width_ft ?? '',
    height_ft: initialData.height_ft ?? '',
    visual_intensity: initialData.visual_intensity ?? '0.50',
    focal_weight: initialData.focal_weight ?? '0.50',
    locked_x_ft: initialData.locked_position?.x_ft ?? '',
    locked_y_ft: initialData.locked_position?.y_ft ?? '',
    theme_tags: initialData.theme_tags || [],
    palette_tags: initialData.palette_tags || [],
    mood_tags: initialData.mood_tags || []
  };
}

export default function ArtworkForm({ initialData, vocabularies, submitLabel, onSubmit, busy }) {
  const [form, setForm] = useState(() => toFormState(initialData));

  const artistOptions = useMemo(() => vocabularies.artists || [], [vocabularies]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="form-shell" onSubmit={handleSubmit}>
      <section className="form-section">
        <h2>Basic Information</h2>
        <div className="form-grid two-col">
          <div className="field-block">
            <label className="field-label">ID</label>
            <input className="text-input" value={form.id} onChange={(e) => updateField('id', e.target.value)} required />
          </div>
          <div className="field-block">
            <label className="field-label">Title</label>
            <input className="text-input" value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
          </div>
          <div className="field-block">
            <label className="field-label">Artist</label>
            <input className="text-input" list="artists-list" value={form.artist} onChange={(e) => updateField('artist', e.target.value)} required />
            <datalist id="artists-list">
              {artistOptions.map((artist) => <option key={artist} value={artist} />)}
            </datalist>
          </div>
          <div className="field-block">
            <label className="field-label">Year</label>
            <input className="text-input" type="number" value={form.year} onChange={(e) => updateField('year', e.target.value)} required />
          </div>
          <div className="field-block">
            <label className="field-label">Period</label>
            <select className="text-input" value={form.period} onChange={(e) => updateField('period', e.target.value)} required>
              <option value="">Select period</option>
              {(vocabularies.periods || []).map((period) => <option key={period} value={period}>{period}</option>)}
            </select>
          </div>
          <div className="field-block">
            <label className="field-label">Medium</label>
            <select className="text-input" value={form.medium} onChange={(e) => updateField('medium', e.target.value)} required>
              <option value="">Select medium</option>
              {(vocabularies.media || []).map((medium) => <option key={medium} value={medium}>{medium}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Dimensions and Display</h2>
        <div className="form-grid four-col">
          <div className="field-block">
            <label className="field-label">Width (ft)</label>
            <input className="text-input" type="number" step="0.01" value={form.width_ft} onChange={(e) => updateField('width_ft', e.target.value)} required />
          </div>
          <div className="field-block">
            <label className="field-label">Height (ft)</label>
            <input className="text-input" type="number" step="0.01" value={form.height_ft} onChange={(e) => updateField('height_ft', e.target.value)} required />
          </div>
          <div className="field-block">
            <label className="field-label">Orientation</label>
            <select className="text-input" value={form.orientation} onChange={(e) => updateField('orientation', e.target.value)}>
              <option value="">Auto / blank</option>
              <option value="portrait">portrait</option>
              <option value="landscape">landscape</option>
              <option value="square">square</option>
            </select>
          </div>
          <div className="field-block">
            <label className="field-label">Primary Theme</label>
            <select className="text-input" value={form.primary_theme} onChange={(e) => updateField('primary_theme', e.target.value)} required>
              <option value="">Select theme</option>
              {(vocabularies.theme_tags || []).map((theme) => <option key={theme} value={theme}>{theme}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Image and Source</h2>
        <ImagePicker value={form.image_url} onChange={(value) => updateField('image_url', value)} />
        <div className="field-block">
          <label className="field-label">Source URL</label>
          <input className="text-input" type="url" value={form.source_url} onChange={(e) => updateField('source_url', e.target.value)} />
        </div>
      </section>

      <section className="form-section">
        <h2>Curator Annotations</h2>
        <div className="form-grid two-col">
          <div className="field-block">
            <label className="field-label">Visual Intensity (0.0–1.0)</label>
            <input className="text-input" type="number" step="0.01" min="0" max="1" value={form.visual_intensity} onChange={(e) => updateField('visual_intensity', e.target.value)} required />
          </div>
          <div className="field-block">
            <label className="field-label">Focal Weight (0.0–1.0)</label>
            <input className="text-input" type="number" step="0.01" min="0" max="1" value={form.focal_weight} onChange={(e) => updateField('focal_weight', e.target.value)} required />
          </div>
        </div>

        <TagSelector label="Theme Tags" options={vocabularies.theme_tags || []} value={form.theme_tags} onChange={(value) => updateField('theme_tags', value)} />
        <TagSelector label="Palette Tags" options={vocabularies.palette_tags || []} value={form.palette_tags} onChange={(value) => updateField('palette_tags', value)} />
        <TagSelector label="Mood Tags" options={vocabularies.mood_tags || []} value={form.mood_tags} onChange={(value) => updateField('mood_tags', value)} />
      </section>

      <section className="form-section">
        <h2>Controls</h2>
        <div className="checkbox-row">
          <label><input type="checkbox" checked={form.eligible} onChange={(e) => updateField('eligible', e.target.checked)} /> Eligible</label>
          <label><input type="checkbox" checked={form.required} onChange={(e) => updateField('required', e.target.checked)} /> Required</label>
          <label><input type="checkbox" checked={form.locked} onChange={(e) => updateField('locked', e.target.checked)} /> Locked</label>
        </div>
        {form.locked ? (
          <div className="form-grid two-col">
            <div className="field-block">
              <label className="field-label">Locked X (ft)</label>
              <input className="text-input" type="number" step="0.01" value={form.locked_x_ft} onChange={(e) => updateField('locked_x_ft', e.target.value)} />
            </div>
            <div className="field-block">
              <label className="field-label">Locked Y (ft)</label>
              <input className="text-input" type="number" step="0.01" value={form.locked_y_ft} onChange={(e) => updateField('locked_y_ft', e.target.value)} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="form-section">
        <h2>Notes</h2>
        <div className="field-block">
          <textarea className="text-area" rows="5" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
        </div>
      </section>

      <div className="form-actions">
        <button className="button" type="submit" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}
