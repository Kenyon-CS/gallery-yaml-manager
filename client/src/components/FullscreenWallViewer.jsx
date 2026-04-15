// client/src/components/FullscreenWallViewer.jsx
import { useEffect, useRef, useState } from 'react';
import WallStage from './WallStage.jsx';

const BASE_WALL_WIDTH_PX = 1800;

export default function FullscreenWallViewer({
  wall,
  arrangement,
  artworkMap,
  onClose
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!wall || !arrangement) return null;

  const wallWidthFt = Number(wall.width_ft) || 10;
  const wallHeightFt = Number(wall.height_ft) || 12;
  const baseScale = BASE_WALL_WIDTH_PX / wallWidthFt;
  const wallWidthPx = wallWidthFt * baseScale;
  const wallHeightPx = wallHeightFt * baseScale;

  function handleWheel(event) {
    event.preventDefault();

    const delta = event.deltaY < 0 ? 1.1 : 0.9;
    setZoom((current) => {
      const next = current * delta;
      return Math.min(4, Math.max(0.35, next));
    });
  }

  function handleMouseDown(event) {
    if (event.button !== 0) return;
    setDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    panStartRef.current = { ...pan };
  }

  function handleMouseMove(event) {
    if (!dragging) return;

    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;

    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function handleReset() {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(17, 24, 39, 0.94)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.9rem 1rem',
          color: '#fff',
          borderBottom: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{wall.name}</div>
          <div style={{ opacity: 0.85 }}>
            {arrangement.title} · {wall.width_ft} ft × {wall.height_ft} ft · Zoom {Math.round(zoom * 100)}%
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="button" type="button" onClick={() => setZoom((z) => Math.min(4, z * 1.2))}>
            Zoom In
          </button>
          <button className="button" type="button" onClick={() => setZoom((z) => Math.max(0.35, z / 1.2))}>
            Zoom Out
          </button>
          <button className="button" type="button" onClick={handleReset}>
            Reset
          </button>
          <button className="button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor: dragging ? 'grabbing' : 'grab'
        }}
      >
        <div
          style={{
            position: 'absolute',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          <WallStage
            wall={wall}
            arrangement={arrangement}
            artworkMap={artworkMap}
            wallWidthPx={wallWidthPx}
            wallHeightPx={wallHeightPx}
          />
        </div>
      </div>
    </div>
  );
}