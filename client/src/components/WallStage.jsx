// client/src/components/WallStage.jsx
import { useState } from 'react';

function numberOr(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
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

export default function WallStage({
    wall,
    arrangement,
    artworkMap,
    wallWidthPx,
    wallHeightPx,
    onClick,
    cursor = 'default'
}) {
    const [hoveredArtworkId, setHoveredArtworkId] = useState(null);

    if (!wall || !arrangement) return null;

    const wallWidthFt = numberOr(wall.width_ft, 10);
    const wallHeightFt = numberOr(wall.height_ft, 12);
    const scale = wallWidthPx / wallWidthFt;

    const items = computePlacedArtworks(arrangement, artworkMap, wallWidthFt, wallHeightFt);
    const overlapIds = findOverlaps(items);

    return (
        <div
            onClick={onClick}
            style={{
                width: `${wallWidthPx}px`,
                height: `${wallHeightPx}px`,
                position: 'relative',
                border: '2px solid #333',
                background: '#f7f3eb',
                overflow: 'visible',
                cursor
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${wallHeightPx - (numberOr(wall.default_hang_y_ft, 5.5) * scale)}px`,
                    borderTop: '1px dashed #999'
                }}
            />

            {items.map((item) => {
                const { placement, artwork, missing } = item;

                // ------------------
                // Missing artwork (fix crash)
                // ------------------
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

                // ------------------
                // Raw geometry
                // ------------------
                const rawWidthPx = numberOr(artwork.width_ft, 0) * scale;
                const rawHeightPx = numberOr(artwork.height_ft, 0) * scale;
                const rawLeftPx = numberOr(placement.x_ft, 0) * scale;
                const rawTopPx =
                    wallHeightPx -
                    ((numberOr(placement.y_ft, 0) + numberOr(artwork.height_ft, 0)) * scale);

                // ------------------
                // CLIPPING (key fix)
                // ------------------
                const clippedLeftPx = Math.max(0, rawLeftPx);
                const clippedTopPx = Math.max(0, rawTopPx);
                const clippedRightPx = Math.min(wallWidthPx, rawLeftPx + rawWidthPx);
                const clippedBottomPx = Math.min(wallHeightPx, rawTopPx + rawHeightPx);

                const clippedWidthPx = Math.max(0, clippedRightPx - clippedLeftPx);
                const clippedHeightPx = Math.max(0, clippedBottomPx - clippedTopPx);

                // Completely off wall
                if (clippedWidthPx <= 0 || clippedHeightPx <= 0) {
                    return (
                        <div
                            key={placement.artwork_id}
                            style={{
                                position: 'absolute',
                                left: `${Math.max(0, Math.min(rawLeftPx, wallWidthPx - 120))}px`,
                                top: `${Math.max(0, Math.min(rawTopPx, wallHeightPx - 28))}px`,
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #dc2626',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem'
                            }}
                        >
                            {artwork.id} off wall
                        </div>
                    );
                }

                // Offset inside image for cropping
                const offsetX = clippedLeftPx - rawLeftPx;
                const offsetY = clippedTopPx - rawTopPx;

                // ------------------
                // Warning logic
                // ------------------
                const warning =
                    item.overflowX ||
                    item.overflowY ||
                    item.offLeft ||
                    item.offBottom ||
                    overlapIds.has(placement.artwork_id);

                // ------------------
                // Render
                // ------------------
                return (
                    <div
                        key={placement.artwork_id}
                        onMouseEnter={() => setHoveredArtworkId(placement.artwork_id)}
                        onMouseLeave={() => setHoveredArtworkId(null)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            left: `${clippedLeftPx}px`,
                            top: `${clippedTopPx}px`,
                            width: `${Math.max(clippedWidthPx, 18)}px`,
                            height: `${Math.max(clippedHeightPx, 18)}px`,
                            border: warning ? '3px solid #dc2626' : '2px solid #222',
                            background: '#fff',
                            overflow: 'visible',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden'
                            }}
                        >
                            {artwork.image_url ? (
                                <img
                                    src={artwork.image_url}
                                    alt={artwork.title}
                                    style={{
                                        position: 'absolute',
                                        left: `${-offsetX}px`,
                                        top: `${-offsetY}px`,
                                        width: `${rawWidthPx}px`,
                                        height: `${rawHeightPx}px`,
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
                        </div>

                        {hoveredArtworkId === placement.artwork_id && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '100%',
                                    top: 0,
                                    marginLeft: '0.5rem',
                                    width: '240px',
                                    background: 'rgba(255,255,255,0.98)',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                                    padding: '0.6rem 0.75rem',
                                    zIndex: 40,
                                    fontSize: '0.85rem',
                                    lineHeight: 1.35,
                                    color: '#111'
                                }}
                            >
                                <strong>{artwork.title}</strong>
                                <div>ID: {artwork.id}</div>
                                <div>{artwork.width_ft} × {artwork.height_ft} ft</div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}