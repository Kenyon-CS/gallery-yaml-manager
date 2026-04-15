// /client/src/pages/WallVisualizerPage.jsx
import { useEffect, useMemo, useState } from 'react';
import WallStage from '../components/WallStage.jsx';
import FullscreenWallViewer from '../components/FullscreenWallViewer.jsx';

const MAX_WALL_WIDTH_PX = 920;
const MAX_WALL_HEIGHT_PX = 520;

function withUser(url) {
    const user = localStorage.getItem('user') || '';
    if (!user) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}user=${encodeURIComponent(user)}`;
}

function numberOr(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function buildArtworkMap(artData) {
    const artworks = artData?.artworks || [];
    return Object.fromEntries(artworks.map((artwork) => [artwork.id, artwork]));
}

function extractRoomsAndWalls(galleryData) {
    const gallery = galleryData || {};

    return (gallery.rooms || []).map((room) => ({
        id: room.id,
        name: room.name,
        walls: (room.walls || []).map((wall) => ({
            id: wall.id,
            name: wall.label || wall.id,
            width_ft: numberOr(wall.length_ft, 10),
            height_ft: numberOr(wall.height_ft, 12),
            default_hang_y_ft: numberOr(wall.default_hang_y_ft, 5.5),
            displayable: Boolean(wall.displayable),
            raw: wall
        }))
    }));
}

function getArrangementsForWall(showData, wallId) {
    const arrangements = showData?.show?.arrangements || [];
    return arrangements.filter((arrangement) => arrangement.space_id === wallId);
}

function computePlacedArtworks(arrangement, artworkMap, wallWidthFt, wallHeightFt) {
    if (!arrangement) return [];

    return (arrangement.placements || []).map((placement) => {
        const artwork = artworkMap[placement.artwork_id];

        if (!artwork) {
            return {
                placement,
                artwork: null,
                missing: true,
                overflowX: false,
                overflowY: false,
                offLeft: false,
                offBottom: false
            };
        }

        const x = numberOr(placement.x_ft, 0);
        const y = numberOr(placement.y_ft, 0);
        const width = numberOr(artwork.width_ft, 0);
        const height = numberOr(artwork.height_ft, 0);

        return {
            placement,
            artwork,
            missing: false,
            overflowX: x + width > wallWidthFt,
            overflowY: y + height > wallHeightFt,
            offLeft: x < 0,
            offBottom: y < 0
        };
    });
}

function findOverlaps(items) {
    const overlaps = new Set();

    for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
            const a = items[i];
            const b = items[j];

            if (!a.artwork || !b.artwork) continue;

            const ax1 = numberOr(a.placement.x_ft, 0);
            const ay1 = numberOr(a.placement.y_ft, 0);
            const ax2 = ax1 + numberOr(a.artwork.width_ft, 0);
            const ay2 = ay1 + numberOr(a.artwork.height_ft, 0);

            const bx1 = numberOr(b.placement.x_ft, 0);
            const by1 = numberOr(b.placement.y_ft, 0);
            const bx2 = bx1 + numberOr(b.artwork.width_ft, 0);
            const by2 = by1 + numberOr(b.artwork.height_ft, 0);

            const intersects = ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;

            if (intersects) {
                overlaps.add(a.placement.artwork_id);
                overlaps.add(b.placement.artwork_id);
            }
        }
    }

    return overlaps;
}

function WallCanvas({ wall, arrangement, artworkMap }) {
    const [hoveredArtworkId, setHoveredArtworkId] = useState(null);

    if (!wall) {
        return <section className="form-section"><p>Select a wall.</p></section>;
    }

    if (!arrangement) {
        return (
            <section className="form-section">
                <h2 style={{ marginTop: 0 }}>{wall.name}</h2>
                <p>No arrangement is assigned to this wall yet.</p>
            </section>
        );
    }

    const wallWidthFt = numberOr(wall.width_ft, 10);
    const wallHeightFt = numberOr(wall.height_ft, 12);

    const scale = Math.min(
        MAX_WALL_WIDTH_PX / wallWidthFt,
        MAX_WALL_HEIGHT_PX / wallHeightFt
    );

    const wallWidthPx = wallWidthFt * scale;
    const wallHeightPx = wallHeightFt * scale;

    const items = computePlacedArtworks(arrangement, artworkMap, wallWidthFt, wallHeightFt);
    const overlapIds = findOverlaps(items);

    return (
        <section className="form-section">
            <h2 style={{ marginTop: 0 }}>{wall.name}</h2>
            <p style={{ marginTop: 0 }}>
                <strong>{arrangement.title}</strong><br />
                Wall size: {wallWidthFt} ft × {wallHeightFt} ft
            </p>

            <div
                style={{
                    width: `${wallWidthPx}px`,
                    height: `${wallHeightPx}px`,
                    position: 'relative',
                    border: '2px solid #333',
                    background: '#f7f3eb',
                    marginBottom: '1rem',
                    overflow: 'visible'
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${wallHeightPx - (wall.default_hang_y_ft * scale)}px`,
                        borderTop: '1px dashed #999'
                    }}
                />

                {items.map((item) => {
                    const { placement, artwork, missing } = item;

                    if (missing) {
                        const leftPx = numberOr(placement.x_ft, 0) * scale;
                        const topPx = wallHeightPx - (numberOr(placement.y_ft, 0) * scale) - 28;

                        return (
                            <div
                                key={placement.artwork_id}
                                style={{
                                    position: 'absolute',
                                    left: `${leftPx}px`,
                                    top: `${topPx}px`,
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    border: '1px solid #dc2626',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Missing artwork: {placement.artwork_id}
                            </div>
                        );
                    }

                    const widthPx = numberOr(artwork.width_ft, 0) * scale;
                    const heightPx = numberOr(artwork.height_ft, 0) * scale;
                    const leftPx = numberOr(placement.x_ft, 0) * scale;
                    const topPx =
                        wallHeightPx -
                        ((numberOr(placement.y_ft, 0) + numberOr(artwork.height_ft, 0)) * scale);

                    const warning =
                        item.overflowX ||
                        item.overflowY ||
                        item.offLeft ||
                        item.offBottom ||
                        overlapIds.has(placement.artwork_id);

                    return (
                        <div
                            key={placement.artwork_id}
                            onMouseEnter={() => setHoveredArtworkId(placement.artwork_id)}
                            onMouseLeave={() => setHoveredArtworkId(null)}
                            style={{
                                position: 'absolute',
                                left: `${leftPx}px`,
                                top: `${topPx}px`,
                                width: `${Math.max(widthPx, 18)}px`,
                                height: `${Math.max(heightPx, 18)}px`,
                                border: warning ? '3px solid #dc2626' : '2px solid #222',
                                background: '#fff',
                                overflow: 'visible',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                        >
                            {artwork.image_url ? (
                                <img
                                    src={artwork.image_url}
                                    alt={artwork.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#ddd',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {artwork.id}
                                </div>
                            )}

                            {hoveredArtworkId === placement.artwork_id ? (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        top: 0,
                                        marginLeft: '0.5rem',
                                        width: '220px',
                                        background: 'rgba(255,255,255,0.97)',
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                                        padding: '0.6rem 0.75rem',
                                        zIndex: 20,
                                        fontSize: '0.85rem',
                                        lineHeight: 1.35,
                                        color: '#111'
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                                        {artwork.title}
                                    </div>
                                    <div><strong>ID:</strong> {artwork.id}</div>
                                    <div><strong>Artist:</strong> {artwork.artist}</div>
                                    <div><strong>Year:</strong> {artwork.year}</div>
                                    <div><strong>Size:</strong> {artwork.width_ft} ft × {artwork.height_ft} ft</div>
                                    <div><strong>Placed at:</strong> ({placement.x_ft}, {placement.y_ft})</div>
                                    {artwork.period ? <div><strong>Period:</strong> {artwork.period}</div> : null}
                                    {artwork.primary_theme ? <div><strong>Theme:</strong> {artwork.primary_theme}</div> : null}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <h3>Warnings</h3>
            <ul>
                {items.filter((item) => item.missing).map((item) => (
                    <li key={`missing-${item.placement.artwork_id}`}>
                        Artwork not found: {item.placement.artwork_id}
                    </li>
                ))}

                {items.filter((item) => item.overflowX).map((item) => (
                    <li key={`overflowx-${item.placement.artwork_id}`}>
                        {item.placement.artwork_id} extends beyond the right edge.
                    </li>
                ))}

                {items.filter((item) => item.overflowY).map((item) => (
                    <li key={`overflowy-${item.placement.artwork_id}`}>
                        {item.placement.artwork_id} extends above the wall height.
                    </li>
                ))}

                {items.filter((item) => item.offLeft).map((item) => (
                    <li key={`offleft-${item.placement.artwork_id}`}>
                        {item.placement.artwork_id} starts left of the wall origin.
                    </li>
                ))}

                {items.filter((item) => item.offBottom).map((item) => (
                    <li key={`offbottom-${item.placement.artwork_id}`}>
                        {item.placement.artwork_id} starts below the wall origin.
                    </li>
                ))}

                {[...overlapIds].map((id) => (
                    <li key={`overlap-${id}`}>{id} overlaps another artwork.</li>
                ))}

                {items.length > 0 &&
                    items.every(
                        (item) =>
                            !item.missing &&
                            !item.overflowX &&
                            !item.overflowY &&
                            !item.offLeft &&
                            !item.offBottom &&
                            !overlapIds.has(item.placement.artwork_id)
                    ) ? (
                    <li>No warnings.</li>
                ) : null}
            </ul>
        </section>
    );
}
export default function WallVisualizerPage() {
    const [galleryData, setGalleryData] = useState(null);
    const [showData, setShowData] = useState(null);
    const [artData, setArtData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedWallId, setSelectedWallId] = useState('');
    const [selectedArrangementId, setSelectedArrangementId] = useState('');
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            setLoading(true);
            setError('');

            try {
                const [galleryRes, showRes, artRes] = await Promise.all([
                    fetch(withUser('/api/gallery')),
                    fetch(withUser('/api/show')),
                    fetch(withUser('/api/art'))
                ]);

                if (!galleryRes.ok) throw new Error(`Failed to load gallery (${galleryRes.status})`);
                if (!showRes.ok) throw new Error(`Failed to load show (${showRes.status})`);
                if (!artRes.ok) throw new Error(`Failed to load art (${artRes.status})`);

                const [galleryJson, showJson, artJson] = await Promise.all([
                    galleryRes.json(),
                    showRes.json(),
                    artRes.json()
                ]);

                if (ignore) return;

                setGalleryData(galleryJson);
                setShowData(showJson);
                setArtData(artJson);

                const rooms = extractRoomsAndWalls(galleryJson);
                const firstDisplayableWall =
                    rooms.flatMap((room) => room.walls).find((wall) => wall.displayable) ||
                    rooms.flatMap((room) => room.walls)[0];

                if (firstDisplayableWall) {
                    setSelectedWallId(firstDisplayableWall.id);

                    const arrangements = getArrangementsForWall(showJson, firstDisplayableWall.id);
                    setSelectedArrangementId(arrangements[0]?.id || '');
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || 'Failed to load wall visualizer.');
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

    const rooms = useMemo(() => extractRoomsAndWalls(galleryData), [galleryData]);
    const artworkMap = useMemo(() => buildArtworkMap(artData), [artData]);

    const allWalls = useMemo(() => rooms.flatMap((room) => room.walls), [rooms]);

    const selectedWall = useMemo(
        () => allWalls.find((wall) => wall.id === selectedWallId) || null,
        [allWalls, selectedWallId]
    );

    const wallArrangements = useMemo(
        () => getArrangementsForWall(showData, selectedWallId),
        [showData, selectedWallId]
    );

    const selectedArrangement = useMemo(
        () => wallArrangements.find((arr) => arr.id === selectedArrangementId) || wallArrangements[0] || null,
        [wallArrangements, selectedArrangementId]
    );

    useEffect(() => {
        if (!wallArrangements.length) {
            setSelectedArrangementId('');
            return;
        }

        const found = wallArrangements.some((arr) => arr.id === selectedArrangementId);
        if (!found) {
            setSelectedArrangementId(wallArrangements[0].id);
        }
    }, [wallArrangements, selectedArrangementId]);

    if (loading) {
        return (
            <div className="page-shell">
                <h1>Wall Visualizer</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-shell">
                <h1>Wall Visualizer</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <h1>Wall Visualizer</h1>
            <p>Select a room wall and view any arrangements assigned to it.</p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '320px 1fr',
                    gap: '1rem',
                    alignItems: 'start'
                }}
            >
                <aside className="form-section">
                    <h2 style={{ marginTop: 0 }}>Rooms and Walls</h2>

                    {rooms.map((room) => (
                        <div key={room.id} style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
                                {room.name} ({room.id})
                            </div>

                            <div style={{ display: 'grid', gap: '0.4rem' }}>
                                {room.walls.map((wall) => {
                                    const active = wall.id === selectedWallId;
                                    const arrangementCount = getArrangementsForWall(showData, wall.id).length;

                                    return (
                                        <button
                                            key={wall.id}
                                            type="button"
                                            className="button"
                                            onClick={() => setSelectedWallId(wall.id)}
                                            style={{
                                                textAlign: 'left',
                                                background: active ? '#1f2937' : undefined,
                                                color: active ? '#fff' : undefined
                                            }}
                                        >
                                            <div>{wall.name}</div>
                                            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                                                {wall.width_ft} ft × {wall.height_ft} ft
                                                {' | '}
                                                {arrangementCount} arrangement{arrangementCount === 1 ? '' : 's'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </aside>

                <div>
                    <section className="form-section">
                        <h2 style={{ marginTop: 0 }}>Wall Preview</h2>
                        <p style={{ marginTop: 0 }}>
                            Click the wall to open the full-screen viewer.
                        </p>

                        {selectedWall && selectedArrangement ? (
                            <WallStage
                                wall={selectedWall}
                                arrangement={selectedArrangement}
                                artworkMap={artworkMap}
                                wallWidthPx={Math.min(920, (Number(selectedWall.width_ft) || 10) * 23)}
                                wallHeightPx={Math.min(520, (Number(selectedWall.height_ft) || 12) * 23)}
                                onClick={() => {
                                    console.log("OPEN FULLSCREEN");
                                    setIsFullscreenOpen(true);
                                }}
                                cursor="zoom-in"
                            />
                        ) : (
                            <div className="form-section">
                                <p>No arrangement is assigned to this wall yet.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
            {isFullscreenOpen && selectedWall && selectedArrangement ? (
                <FullscreenWallViewer
                    wall={selectedWall}
                    arrangement={selectedArrangement}
                    artworkMap={artworkMap}
                    onClose={() => setIsFullscreenOpen(false)}
                />
            ) : null}
        </div>
    );
}