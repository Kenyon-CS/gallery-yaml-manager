// client/src/pages/WallDesignPage.jsx
import { useEffect, useMemo, useState } from 'react';
import ArtworkCard from '../components/ArtworkCard.jsx';

function withUser(url) {
    const user = localStorage.getItem('user') || '';
    if (!user) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}user=${encodeURIComponent(user)}`;
}

function getArtworkPlacement(artworkId, arrangements) {
    for (const arrangement of arrangements || []) {
        for (const placement of arrangement.placements || []) {
            if (placement.artwork_id === artworkId) {
                return arrangement.space_id || '';
            }
        }
    }
    return '';
}

function getWallDesign(wallId, wallDesigns) {
    return (wallDesigns || []).find((item) => item.wall_id === wallId) || null;
}


export default function WallDesignPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [activeShowFile, setActiveShowFile] = useState('');
    const [activeArtFile, setActiveArtFile] = useState('');

    const [artworks, setArtworks] = useState([]);
    const [wallDesigns, setWallDesigns] = useState([]);
    const [arrangements, setArrangements] = useState([]);
    const [selectedWall, setSelectedWall] = useState('');
    const [currentShow, setCurrentShow] = useState(null);

    function updateFilter(name, value) {
        setFilters((current) => ({ ...current, [name]: value }));
    }

    const [filters, setFilters] = useState({
        search: '',
        period: '',
        theme: '',
        artist: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const [currentProjectRes, artRes, showRes] = await Promise.all([
                fetch(withUser('/api/projects/current')),
                fetch(withUser('/api/art')),
                fetch(withUser('/api/show'))
            ]);

            const currentProjectJson = await currentProjectRes.json().catch(() => ({}));
            const artJson = await artRes.json().catch(() => ({}));
            const showJson = await showRes.json().catch(() => ({}));

            if (!currentProjectRes.ok) {
                throw new Error(currentProjectJson.error || `Failed to load current project (${currentProjectRes.status})`);
            }

            if (!artRes.ok) {
                throw new Error(artJson.error || `Failed to load art data (${artRes.status})`);
            }

            if (!showRes.ok) {
                throw new Error(showJson.error || `Failed to load show data (${showRes.status})`);
            }

            const currentProject = currentProjectJson?.project?.project || {};
            const nextActiveShow = currentProject?.active?.show || '';
            const nextActiveArt = currentProject?.active?.art || '';

            const rawArtworks = artJson?.art?.artworks || artJson?.artworks || [];

            const seenIds = new Set();
            const nextArtworks = rawArtworks.filter((artwork) => {
                const id = String(artwork?.id || '').trim();
                if (!id) return false;
                if (seenIds.has(id)) return false;
                seenIds.add(id);
                return true;
            }); const nextShow = showJson?.show || {};
            const nextWallDesigns = nextShow?.wall_designs || [];
            const nextArrangements = nextShow?.arrangements || [];

            setActiveShowFile(nextActiveShow);
            setActiveArtFile(nextActiveArt);
            setArtworks(nextArtworks);
            setCurrentShow(nextShow);
            setWallDesigns(nextWallDesigns);
            setArrangements(nextArrangements);

            setSelectedWall((current) => {
                if (current && nextWallDesigns.some((w) => w.wall_id === current)) {
                    return current;
                }
                return nextWallDesigns[0]?.wall_id || '';
            });
        } catch (err) {
            setError(err.message || 'Failed to load wall design data.');
        } finally {
            setLoading(false);
        }
    }

    const selectedWallDesign = useMemo(
        () => getWallDesign(selectedWall, wallDesigns),
        [selectedWall, wallDesigns]
    );

    const candidateIds = selectedWallDesign?.candidate_artwork_ids || [];

    const vocabularies = useMemo(() => {
        const periods = new Set();
        const themeTags = new Set();
        const artists = new Set();

        for (const artwork of artworks) {
            if (artwork.period) periods.add(artwork.period);
            if (artwork.artist) artists.add(artwork.artist);

            for (const tag of artwork.theme_tags || []) {
                if (tag) themeTags.add(tag);
            }
        }

        return {
            periods: Array.from(periods).sort(),
            theme_tags: Array.from(themeTags).sort(),
            artists: Array.from(artists).sort()
        };
    }, [artworks]);

    const visibleArtworks = useMemo(() => {
        if (!selectedWall) return [];

        return artworks
            .filter((artwork) => {
                const placedWall = getArtworkPlacement(artwork.id, arrangements);
                const isCandidate = candidateIds.includes(artwork.id);
                return isCandidate || !placedWall;
            })
            .filter((artwork) => {
                const search = filters.search.trim().toLowerCase();
                const title = String(artwork.title || '').toLowerCase();
                const artist = String(artwork.artist || '').toLowerCase();
                const id = String(artwork.id || '').toLowerCase();
                const period = String(artwork.period || '');
                const themes = artwork.theme_tags || [];

                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    artist.includes(search) ||
                    id.includes(search) ||
                    themes.some((tag) => String(tag).toLowerCase().includes(search));

                const matchesPeriod = !filters.period || period === filters.period;
                const matchesTheme = !filters.theme || themes.includes(filters.theme);
                const matchesArtist = !filters.artist || artwork.artist === filters.artist;

                return matchesSearch && matchesPeriod && matchesTheme && matchesArtist;
            });
    }, [artworks, arrangements, candidateIds, selectedWall, filters]);

    async function saveWallDesigns(nextWallDesigns) {
        if (!currentShow) return;

        const nextShow = {
            ...currentShow,
            wall_designs: nextWallDesigns
        };

        const res = await fetch(withUser('/api/show'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ show: nextShow })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.error || `Failed to save wall design (${res.status})`);
        }

        setCurrentShow(nextShow);
        setWallDesigns(nextWallDesigns);
    }

    async function handleToggleArtwork(artworkId, checked) {
        if (!selectedWallDesign) return;

        setSaving(true);
        setError('');
        setMessage('');

        try {
            let nextCandidateIds;

            if (checked) {
                nextCandidateIds = candidateIds.includes(artworkId)
                    ? candidateIds
                    : [...candidateIds, artworkId];
            } else {
                nextCandidateIds = candidateIds.filter((id) => id !== artworkId);
            }

            const nextWallDesigns = wallDesigns.map((item) =>
                item.wall_id === selectedWall
                    ? { ...item, candidate_artwork_ids: nextCandidateIds }
                    : item
            );

            await saveWallDesigns(nextWallDesigns);
            setMessage('Wall design updated.');
        } catch (err) {
            setError(err.message || 'Failed to update wall design.');
        } finally {
            setSaving(false);
        }
    }

    async function handleSelectAllUnused() {
        if (!selectedWallDesign) return;

        setSaving(true);
        setError('');
        setMessage('');

        try {
            const unusedIds = artworks
                .filter((artwork) => !getArtworkPlacement(artwork.id, arrangements))
                .map((artwork) => artwork.id);

            const nextCandidateIds = Array.from(new Set([...candidateIds, ...unusedIds]));

            const nextWallDesigns = wallDesigns.map((item) =>
                item.wall_id === selectedWall
                    ? { ...item, candidate_artwork_ids: nextCandidateIds }
                    : item
            );

            await saveWallDesigns(nextWallDesigns);
            setMessage('Added all unused artworks to this wall.');
        } catch (err) {
            setError(err.message || 'Failed to update wall design.');
        } finally {
            setSaving(false);
        }
    }

    async function handleClearWall() {
        if (!selectedWallDesign) return;

        setSaving(true);
        setError('');
        setMessage('');

        try {
            const nextWallDesigns = wallDesigns.map((item) =>
                item.wall_id === selectedWall
                    ? { ...item, candidate_artwork_ids: [] }
                    : item
            );

            await saveWallDesigns(nextWallDesigns);
            setMessage('Cleared all candidates from this wall.');
        } catch (err) {
            setError(err.message || 'Failed to update wall design.');
        } finally {
            setSaving(false);
        }
    }

    function renderPlacementStatus(artwork) {
        const placedWall = getArtworkPlacement(artwork.id, arrangements);
        if (!placedWall) return 'Not placed';
        if (placedWall === selectedWall) return 'Placed on this wall';
        return `Placed on ${placedWall}`;
    }

    if (loading) {
        return (
            <div className="stack-lg">
                <section className="hero card">
                    <h1>Wall Design</h1>
                    <p>Loading wall design data...</p>
                </section>
            </div>
        );
    }

    return (
        <div className="stack-lg">
            <section className="hero card">
                <h1>Wall Design</h1>
                <p>Choose a wall and select which artworks are candidates for that wall.</p>
                <div style={{ marginTop: '0.75rem' }}>
                    <div><strong>Active show file:</strong> {activeShowFile || 'None selected'}</div>
                    <div><strong>Active art file:</strong> {activeArtFile || 'None selected'}</div>
                </div>
            </section>

            <section className="card">
                <div className="form-grid two-col">
                    <div className="field-block">
                        <label className="field-label">Wall</label>
                        <select
                            className="text-input"
                            value={selectedWall}
                            onChange={(e) => setSelectedWall(e.target.value)}
                            disabled={saving || wallDesigns.length === 0}
                        >
                            <option value="">-- select wall --</option>
                            {wallDesigns.map((wall) => (
                                <option key={wall.wall_id} value={wall.wall_id}>
                                    {wall.wall_id}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button className="button" type="button" onClick={handleSelectAllUnused} disabled={saving || !selectedWall}>
                        Add All Unused
                    </button>
                    <button className="button" type="button" onClick={handleClearWall} disabled={saving || !selectedWall}>
                        Clear Wall
                    </button>
                    <button
                        className="button"
                        type="button"
                        onClick={() => setFilters({ search: '', period: '', theme: '', artist: '' })}
                    >
                        Clear Filters
                    </button>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
                    <strong>Candidates:</strong> {candidateIds.length} &nbsp; | &nbsp;
                    <strong>Visible artworks:</strong> {visibleArtworks.length}
                </div>
            </section>

            <section className="card">
                <div className="form-grid four-col">
                    <div className="field-block">
                        <label className="field-label">Search</label>
                        <input
                            className="text-input"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder="title, artist, id, theme..."
                        />
                    </div>

                    <div className="field-block">
                        <label className="field-label">Period</label>
                        <select
                            className="text-input"
                            value={filters.period}
                            onChange={(e) => updateFilter('period', e.target.value)}
                        >
                            <option value="">All periods</option>
                            {vocabularies.periods.map((period) => (
                                <option key={period} value={period}>
                                    {period}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field-block">
                        <label className="field-label">Theme</label>
                        <select
                            className="text-input"
                            value={filters.theme}
                            onChange={(e) => updateFilter('theme', e.target.value)}
                        >
                            <option value="">All themes</option>
                            {vocabularies.theme_tags.map((theme) => (
                                <option key={theme} value={theme}>
                                    {theme}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field-block">
                        <label className="field-label">Artist</label>
                        <select
                            className="text-input"
                            value={filters.artist}
                            onChange={(e) => updateFilter('artist', e.target.value)}
                        >
                            <option value="">All artists</option>
                            {vocabularies.artists.map((artist) => (
                                <option key={artist} value={artist}>
                                    {artist}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>
            {error ? <div className="notice error">{error}</div> : null}
            {message ? <div className="notice">{message}</div> : null}

            <section className="artwork-grid">
                {visibleArtworks.map((artwork, index) => {
                    const checked = candidateIds.includes(artwork.id);

                    return (
                        <div key={`${artwork.id}-${index}`} className="card stack-md">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{artwork.title}</div>
                                    <div style={{ opacity: 0.8 }}>{artwork.artist || 'Unknown artist'}</div>
                                    <div style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>
                                        {renderPlacementStatus(artwork)}
                                    </div>
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={saving || !selectedWall}
                                        onChange={(e) => handleToggleArtwork(artwork.id, e.target.checked)}
                                    />
                                    Include
                                </label>
                            </div>

                            <ArtworkCard artwork={artwork} />
                        </div>
                    );
                })}
            </section>

            {!selectedWall ? <div className="notice">Select a wall to begin.</div> : null}
            {selectedWall && !loading && visibleArtworks.length === 0 ? (
                <div className="notice">No available artworks for this wall.</div>
            ) : null}
        </div>
    );
}