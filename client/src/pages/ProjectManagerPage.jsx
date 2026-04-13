import { useEffect, useState } from 'react';

function emptyForm() {
  return {
    projectName: '',
    projectDescription: '',
    newFileType: 'show',
    newFileName: ''
  };
}

export default function ProjectManagerPage() {
  const [projects, setProjects] = useState([]);
  const [currentFilename, setCurrentFilename] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm());

  async function loadAll() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const [projectsRes, currentRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/projects/current')
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
      const res = await fetch('/api/projects/current', {
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
      const res = await fetch('/api/projects', {
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
      const res = await fetch(`/api/projects/${encodeURIComponent(currentFilename)}/active`, {
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
      const res = await fetch(`/api/projects/${encodeURIComponent(currentFilename)}/files`, {
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

        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          {files.length ? files.join(', ') : 'No files yet.'}
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
      <p>Select a project, switch active files, and create new project files.</p>

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
                    <option value="art">art</option>
                    <option value="gallery">gallery</option>
                    <option value="show">show</option>
                    <option value="scoring">scoring</option>
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