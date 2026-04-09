// client/src/pages/ScoringSettingsPage.jsx
import { useEffect, useMemo, useState } from 'react';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function formatLabel(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function pathToString(path) {
  return path.join('.');
}

function getAtPath(obj, path) {
  return path.reduce((current, key) => current?.[key], obj);
}

function setAtPath(obj, path, value) {
  const next = deepClone(obj);

  if (path.length === 0) {
    return value;
  }

  let cursor = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    cursor = cursor[path[i]];
  }

  cursor[path[path.length - 1]] = value;
  return next;
}

function inferScalarType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
}

function parseScalarInput(rawValue, originalValue) {
  if (typeof originalValue === 'boolean') {
    return Boolean(rawValue);
  }

  if (typeof originalValue === 'number') {
    if (rawValue === '') return '';
    const parsed = Number(rawValue);
    return Number.isNaN(parsed) ? originalValue : parsed;
  }

  return rawValue;
}

function ScalarEditor({ label, value, originalValue, path, onChange }) {
  const scalarType = inferScalarType(originalValue ?? value);

  if (scalarType === 'boolean') {
    return (
      <div className="field-block">
        <label className="field-label">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(path, e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          {label}
        </label>
      </div>
    );
  }

  if (scalarType === 'number') {
    return (
      <div className="field-block">
        <label className="field-label">{label}</label>
        <input
          className="text-input"
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(path, parseScalarInput(e.target.value, originalValue ?? value))}
        />
      </div>
    );
  }

  const isLongText = typeof value === 'string' && value.length > 90;

  return (
    <div className="field-block">
      <label className="field-label">{label}</label>
      {isLongText ? (
        <textarea
          className="text-area"
          rows="3"
          value={value ?? ''}
          onChange={(e) => onChange(path, e.target.value)}
        />
      ) : (
        <input
          className="text-input"
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(path, e.target.value)}
        />
      )}
    </div>
  );
}

function ArrayEditor({ label, value, originalValue, path, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const originalItems = Array.isArray(originalValue) ? originalValue : [];

  const allScalars = items.every((item) => !isPlainObject(item) && !Array.isArray(item));

  return (
    <section className="form-section">
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <div style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '0.75rem' }}>
        {pathToString(path)}
      </div>

      {items.length === 0 ? <div>No items.</div> : null}

      {allScalars ? (
        <div className="form-grid two-col">
          {items.map((item, index) => (
            <ScalarEditor
              key={index}
              label={`${label} [${index}]`}
              value={item}
              originalValue={originalItems[index]}
              path={[...path, index]}
              onChange={onChange}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                background: '#fafafa'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                {label} [{index}]
              </div>
              <NodeEditor
                label={`${label} [${index}]`}
                value={item}
                originalValue={originalItems[index]}
                path={[...path, index]}
                onChange={onChange}
                nested
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ObjectEditor({ label, value, originalValue, path, onChange, nested = false }) {
  const entries = Object.entries(value || {});
  const wrapperStyle = nested
    ? {}
    : {
        display: 'grid',
        gap: '1rem'
      };

  return (
    <section className="form-section" style={nested ? { margin: 0, padding: 0, border: 'none' } : undefined}>
      {!nested ? <h2>{label}</h2> : null}
      {!nested ? (
        <div style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '0.75rem' }}>
          {pathToString(path)}
        </div>
      ) : null}

      <div style={wrapperStyle}>
        {entries.map(([key, childValue]) => {
          const childOriginal = originalValue?.[key];
          return (
            <NodeEditor
              key={key}
              label={formatLabel(key)}
              value={childValue}
              originalValue={childOriginal}
              path={[...path, key]}
              onChange={onChange}
            />
          );
        })}
      </div>
    </section>
  );
}

function NodeEditor({ label, value, originalValue, path, onChange, nested = false }) {
  if (Array.isArray(value)) {
    return (
      <ArrayEditor
        label={label}
        value={value}
        originalValue={originalValue}
        path={path}
        onChange={onChange}
      />
    );
  }

  if (isPlainObject(value)) {
    return (
      <ObjectEditor
        label={label}
        value={value}
        originalValue={originalValue}
        path={path}
        onChange={onChange}
        nested={nested}
      />
    );
  }

  return (
    <ScalarEditor
      label={label}
      value={value}
      originalValue={originalValue}
      path={path}
      onChange={onChange}
    />
  );
}

export default function ScoringSettingsPage() {
  const [originalData, setOriginalData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await fetch('/api/scoring-settings');
        if (!response.ok) {
          throw new Error(`Failed to load scoring settings (${response.status})`);
        }

        const data = await response.json();

        if (!ignore) {
          setOriginalData(data);
          setEditedData(deepClone(data));
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load scoring settings.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!originalData || !editedData) return false;
    return JSON.stringify(originalData) !== JSON.stringify(editedData);
  }, [originalData, editedData]);

  function handleChange(path, value) {
    setEditedData((current) => setAtPath(current, path, value));
  }

  function handleReset() {
    setEditedData(deepClone(originalData));
    setMessage('Changes reset.');
    setError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!editedData) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/scoring-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save scoring settings (${response.status})`);
      }

      const saved = await response.json();
      setOriginalData(saved);
      setEditedData(deepClone(saved));
      setMessage('Scoring settings saved.');
    } catch (err) {
      setError(err.message || 'Failed to save scoring settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <h1>Scoring Settings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !editedData) {
    return (
      <div className="page-shell">
        <h1>Scoring Settings</h1>
        <p>{error}</p>
      </div>
    );
  }

  const scoring = editedData?.scoring ?? {};
  const scoringOriginal = originalData?.scoring ?? {};

  return (
    <div className="page-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Scoring Settings</h1>
          <p style={{ marginTop: 0 }}>
            Edit existing scoring values here. Structural changes should still be made in the YAML file.
          </p>
        </div>
      </div>

      {error ? <div style={{ color: '#a11', marginBottom: '1rem' }}>{error}</div> : null}
      {message ? <div style={{ color: '#166534', marginBottom: '1rem' }}>{message}</div> : null}

      <form className="form-shell" onSubmit={handleSave}>
        <ObjectEditor
          label="Scoring"
          value={scoring}
          originalValue={scoringOriginal}
          path={['scoring']}
          onChange={handleChange}
        />

        <div className="form-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="button" type="submit" disabled={saving || !isDirty}>
            {saving ? 'Saving...' : 'Save Scoring Settings'}
          </button>
          <button className="button" type="button" onClick={handleReset} disabled={saving || !isDirty}>
            Reset Changes
          </button>
        </div>
      </form>
    </div>
  );
}