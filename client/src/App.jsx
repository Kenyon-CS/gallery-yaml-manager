import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import ArtworkListPage from './pages/ArtworkListPage.jsx';
import AddArtworkPage from './pages/AddArtworkPage.jsx';
import EditArtworkPage from './pages/EditArtworkPage.jsx';
import ArtworkDetailPage from './pages/ArtworkDetailPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import ScoringSettingsPage from './pages/ScoringSettingsPage.jsx';
import WallVisualizerPage from './pages/WallVisualizerPage.jsx';
import ProjectManagerPage from './pages/ProjectManagerPage.jsx';

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await res.json();

      localStorage.setItem('user', data.username);
      localStorage.setItem('role', data.role);

      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <main className="page-shell">
      <div style={{ maxWidth: 420, margin: '3rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          {error && (
            <div style={{ color: 'darkred', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button type="submit">Log In</button>
        </form>
      </div>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const username = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    if (username) {
      setUser({ username, role });
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">Gund Gallery Show Builder</Link>

          <nav className="topnav">
            <NavLink to="/" end>Artworks</NavLink>
            <NavLink to="/artworks/new">Add Artwork</NavLink>
            <NavLink to="/gallery">Gallery</NavLink>
            <NavLink to="/visualizer">Visualizer</NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/scoring-settings">Scoring Settings</NavLink>
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span>
              Logged in as <strong>{user.username}</strong>
              {user.role ? ` (${user.role})` : ''}
            </span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<ArtworkListPage />} />
          <Route path="/artworks/new" element={<AddArtworkPage />} />
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
          <Route path="/artworks/:id/edit" element={<EditArtworkPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/visualizer" element={<WallVisualizerPage />} />
          <Route path="/projects" element={<ProjectManagerPage />} />
          <Route path="/scoring-settings" element={<ScoringSettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}