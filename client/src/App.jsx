import { Link, NavLink, Route, Routes } from 'react-router-dom';
import ArtworkListPage from './pages/ArtworkListPage.jsx';
import AddArtworkPage from './pages/AddArtworkPage.jsx';
import EditArtworkPage from './pages/EditArtworkPage.jsx';
import ArtworkDetailPage from './pages/ArtworkDetailPage.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">Gallery YAML Manager</Link>
          <nav className="topnav">
            <NavLink to="/" end>Artworks</NavLink>
            <NavLink to="/artworks/new">Add Artwork</NavLink>
          </nav>
        </div>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<ArtworkListPage />} />
          <Route path="/artworks/new" element={<AddArtworkPage />} />
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
          <Route path="/artworks/:id/edit" element={<EditArtworkPage />} />
        </Routes>
      </main>
    </div>
  );
}
