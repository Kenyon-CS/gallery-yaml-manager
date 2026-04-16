// client/src/pages/ProjectManagerPage.jsx
import { useEffect, useRef, useState } from 'react';

const FILE_TYPES = ['art', 'gallery', 'show', 'scoring'];

function emptyForm() {
  return {
    projectName: '',
    projectDescription: '',
    newFileType: 'show',
    newFileName: ''
  };
}

function withUser(url) {
  const user = localStorage.getItem('user') || '';
  if (!user) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}user=${encodeURIComponent(user)}`;
}

/*function buildFilename(type, rawName) {
  const trimmed = (rawName || '').trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase().endsWith('.yaml') || trimmed.toLowerCase().endsWith('.yml')) {
    return trimmed;
  }
  return `${trimmed}.yaml`;
}*/

function getAcceptForType(type) {
  return '.yaml,.yml';
}

export default function ProjectManagerPage() {
  const uploadRefs = useRef({
    art: null,
    gallery: null,
    show: null,
    scoring: null
  });

  const [projects, setProjects] = useState([]);
  const [currentFilename, setCurrentFilename] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm());

  const [cloneForm, setCloneForm] = useState({
    art: { sourceFilename: '', newName: '' },
    gallery: { sourceFilename: '', newName: '' },
    show: { sourceFilename: '', newName: '' },
    scoring: { sourceFilename: '', newName: '' }
  });

  async function handleCloneFile(type) {
    if (!currentFilename) return;

    const payload = cloneForm[type];
    if (!payload.sourceFilename) {
      setError(`Please choose a ${type} file to clone.`);
      return;
    }

    if (!payload.newName.trim()) {
      setError('Please enter a new file name.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(
        withUser(`/api/projects/${encodeURIComponent(currentFilename)}/files/clone`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            sourceFilename: payload.sourceFilename,
            newName: payload.newName
          })
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to clone ${type} file (${res.status})`);
      }

      await loadAll();

      setCloneForm((prev) => ({
        ...prev,
        [type]: { sourceFilename: '', newName: '' }
      }));

      setMessage(`Cloned ${data.sourceFilename} to ${data.filename}.`);
    } catch (err) {
      setError(err.message || `Failed to clone ${type} file.`);
    } finally {
      setSaving(false);
    }
  }

  async function loadAll() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const [projectsRes, currentRes] = await Promise.all([
        fetch(withUser('/api/projects')),
        fetch(withUser('/api/projects/current'))
      ]);

      const projectsJson = await projectsRes.json();
      const currentJson = await currentRes.json();

      if (!projectsRes.ok) {
        throw new Error(projectsJson.error || `Failed to load projects (${projectsRes.status})`);
      }

      if (!currentRes.ok) {
        throw new Error(currentJson.error || `Failed to load current project (${currentRes.status})`);
      }

      setProjects(projectsJson.projects || []);
      setCurrentFilename(currentJson.filename || '');
      setCurrentProject(currentJson.project || null);
    } catch (err) {
      setError(err.message || 'Failed to load project data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSwitchProject(filename) {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(withUser('/api/projects/current'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to switch project (${res.status})`);
      }

      await loadAll();
      setMessage('Current project updated.');
    } catch (err) {
      setError(err.message || 'Failed to switch project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(withUser('/api/projects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.projectName,
          description: form.projectDescription
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to create project (${res.status})`);
      }

      await handleSwitchProject(data.filename);

      setForm((prev) => ({
        ...prev,
        projectName: '',
        projectDescription: ''
      }));

      setMessage('Project created.');
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(type, filename) {
    if (!currentFilename) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(withUser(`/api/projects/${encodeURIComponent(currentFilename)}/active`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: filename })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to update active ${type} (${res.status})`);
      }

      await loadAll();
      setMessage(`Active ${type} updated.`);
    } catch (err) {
      setError(err.message || `Failed to update active ${type}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFile(event) {
    event.preventDefault();
    if (!currentFilename) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(withUser(`/api/projects/${encodeURIComponent(currentFilename)}/files`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.newFileType,
          name: form.newFileName
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to create file (${res.status})`);
      }

      await loadAll();
      setForm((prev) => ({
        ...prev,
        newFileName: ''
      }));
      setMessage(`${data.filename} created.`);
    } catch (err) {
      setError(err.message || 'Failed to create file.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadFile(type, event) {
    event.preventDefault();
    if (!currentFilename) return;

    const file = uploadRefs.current[type]?.files?.[0];
    if (!file) {
      setError(`Please choose a ${type}.yaml file to upload.`);
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.yaml') && !lower.endsWith('.yml')) {
      setError('Only .yaml or .yml files are allowed.');
      return;
    }

    const existingFiles = currentProject?.project?.files?.[type] || [];
    const sameNameExists = existingFiles.includes(file.name);

    if (sameNameExists) {
      const ok = window.confirm(
        `${file.name} already exists in ${type}. Overwrite it?`
      );
      if (!ok) return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('overwrite', sameNameExists ? 'true' : 'false');

      const res = await fetch(
        withUser(`/api/projects/${encodeURIComponent(currentFilename)}/upload/${type}`),
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to upload ${type} file (${res.status})`);
      }

      await loadAll();

      if (data.filename) {
        await handleSetActive(type, data.filename);
      }

      if (uploadRefs.current[type]) {
        uploadRefs.current[type].value = '';
      }

      setMessage(`Uploaded ${data.filename || file.name}.`);
    } catch (err) {
      setError(err.message || `Failed to upload ${type} file.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadFile(type, filename) {
    if (!currentFilename || !filename) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(
        withUser(`/api/projects/${encodeURIComponent(currentFilename)}/download/${type}/${encodeURIComponent(filename)}`)
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to download ${filename} (${res.status})`);
      }

      const blob = await res.blob();

      // Best path: browser save picker, which will naturally handle overwrite confirmation.
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'YAML files',
              accept: { 'application/x-yaml': ['.yaml', '.yml'] }
            }
          ]
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        setMessage(`Downloaded ${filename}.`);
        return;
      }

      // Fallback: standard browser download. No reliable overwrite check is possible here.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMessage(`Downloaded ${filename}.`);
    } catch (err) {
      if (err?.name === 'AbortError') {
        setMessage('Download canceled.');
      } else {
        setError(err.message || `Failed to download ${filename}.`);
      }
    } finally {
      setSaving(false);
    }
  }

  function renderFilePicker(type, label) {
    const files = currentProject?.project?.files?.[type] || [];
    const active = currentProject?.project?.active?.[type] || '';

    return (
      <section className="form-section">
        <h3 style={{ marginTop: 0 }}>{label}</h3>

        <div className="field-block">
          <label className="field-label">Active {type} file</label>
          <select
            className="text-input"
            value={active}
            onChange={(e) => handleSetActive(type, e.target.value)}
            disabled={saving || !currentFilename}
          >
            <option value="">-- none --</option>
            {files.map((filename) => (
              <option key={filename} value={filename}>
                {filename}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={(e) => handleUploadFile(type, e)}>
          <div className="field-block">
            <label className="field-label">Upload {type} YAML</label>
            <input
              type="file"
              accept={getAcceptForType(type)}
              ref={(el) => {
                uploadRefs.current[type] = el;
              }}
              className="text-input"
              disabled={saving || !currentFilename}
            />
          </div>

          <button className="button" type="submit" disabled={saving || !currentFilename}>
            Upload {type}
          </button>
        </form>
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
          <h4 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Clone {type} file</h4>

          <div className="field-block">
            <label className="field-label">Source file</label>
            <select
              className="text-input"
              value={cloneForm[type].sourceFilename}
              onChange={(e) =>
                setCloneForm((prev) => ({
                  ...prev,
                  [type]: {
                    ...prev[type],
                    sourceFilename: e.target.value
                  }
                }))
              }
              disabled={saving || !currentFilename}
            >
              <option value="">-- select source file --</option>
              {files.map((filename) => (
                <option key={filename} value={filename}>
                  {filename}
                </option>
              ))}
            </select>
          </div>

          <div className="field-block">
            <label className="field-label">New file name</label>
            <input
              className="text-input"
              value={cloneForm[type].newName}
              onChange={(e) =>
                setCloneForm((prev) => ({
                  ...prev,
                  [type]: {
                    ...prev[type],
                    newName: e.target.value
                  }
                }))
              }
              placeholder={`e.g. ${type}-experiment-2`}
              disabled={saving || !currentFilename}
            />
          </div>

          <button
            type="button"
            className="button"
            onClick={() => handleCloneFile(type)}
            disabled={saving || !currentFilename}
          >
            Clone {type}
          </button>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          {files.length ? (
            files.map((filename) => (
              <div
                key={filename}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  alignItems: 'center',
                  marginBottom: '0.4rem'
                }}
              >
                <span>{filename}</span>
                <button
                  type="button"
                  className="button"
                  onClick={() => handleDownloadFile(type, filename)}
                  disabled={saving}
                >
                  Download
                </button>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>No files yet.</div>
          )}
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="page-shell">
        <h1>Project Manager</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <h1>Project Manager</h1>
      <p>Select a project, switch active files, create files, upload files, and download files.</p>

      {error ? <div style={{ color: '#a11', marginBottom: '1rem' }}>{error}</div> : null}
      {message ? <div style={{ color: '#166534', marginBottom: '1rem' }}>{message}</div> : null}

      <section className="form-section">
        <h2 style={{ marginTop: 0 }}>Current Project</h2>
        <div className="field-block">
          <label className="field-label">Project</label>
          <select
            className="text-input"
            value={currentFilename}
            onChange={(e) => handleSwitchProject(e.target.value)}
            disabled={saving}
          >
            <option value="">-- select project --</option>
            {projects.map((project) => (
              <option key={project.filename} value={project.filename}>
                {project.name} ({project.filename})
              </option>
            ))}
          </select>
        </div>

        {currentProject?.project ? (
          <div>
            <div><strong>Name:</strong> {currentProject.project.name}</div>
            <div><strong>ID:</strong> {currentProject.project.id}</div>
            {currentProject.project.description ? (
              <div><strong>Description:</strong> {currentProject.project.description}</div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="form-section">
        <h2 style={{ marginTop: 0 }}>Create Project</h2>
        <form onSubmit={handleCreateProject}>
          <div className="form-grid two-col">
            <div className="field-block">
              <label className="field-label">Project name</label>
              <input
                className="text-input"
                value={form.projectName}
                onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))}
              />
            </div>

            <div className="field-block">
              <label className="field-label">Description</label>
              <input
                className="text-input"
                value={form.projectDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, projectDescription: e.target.value }))}
              />
            </div>
          </div>

          <button className="button" type="submit" disabled={saving}>
            Create Project
          </button>
        </form>
      </section>

      {currentFilename ? (
        <>
          <div className="form-grid two-col">
            {renderFilePicker('art', 'Art Files')}
            {renderFilePicker('gallery', 'Gallery Files')}
            {renderFilePicker('show', 'Show Files')}
            {renderFilePicker('scoring', 'Scoring Files')}
          </div>

          <section className="form-section">
            <h2 style={{ marginTop: 0 }}>Create File in Current Project</h2>
            <form onSubmit={handleCreateFile}>
              <div className="form-grid two-col">
                <div className="field-block">
                  <label className="field-label">File type</label>
                  <select
                    className="text-input"
                    value={form.newFileType}
                    onChange={(e) => setForm((prev) => ({ ...prev, newFileType: e.target.value }))}
                  >
                    {FILE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-block">
                  <label className="field-label">New file name</label>
                  <input
                    className="text-input"
                    value={form.newFileName}
                    onChange={(e) => setForm((prev) => ({ ...prev, newFileName: e.target.value }))}
                    placeholder="e.g. jim-experiment-1"
                  />
                </div>
              </div>

              <button className="button" type="submit" disabled={saving}>
                Create File
              </button>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}