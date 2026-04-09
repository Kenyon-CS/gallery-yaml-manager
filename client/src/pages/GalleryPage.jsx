import { useEffect, useState } from 'react';
import { fetchGallery } from '../api.js';

export default function GalleryPage() {
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGallery();
  }, []);

  async function loadGallery() {
    setLoading(true);
    setError('');

    try {
      const data = await fetchGallery();
      setGallery(data);
    } catch (err) {
      setError(err.message || 'Failed to load gallery.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="notice">Loading gallery structure...</div>;
  }

  if (error) {
    return <div className="notice error">{error}</div>;
  }

  if (!gallery) {
    return <div className="notice">No gallery data available.</div>;
  }

  const rooms = gallery.rooms || [];
  const doors = gallery.doors || [];
  const windows = gallery.windows || [];

  return (
    <div className="stack-lg">
      <section className="hero card">
        <h1>Gallery Structure</h1>
        <p>Rooms, walls, doors, and windows defined in <code>gallery.yaml</code>.</p>
      </section>

      <section className="card">
        <h2>Gallery Information</h2>
        <div className="detail-grid">
          <div><strong>ID:</strong> {gallery.id}</div>
          <div><strong>Name:</strong> {gallery.name}</div>
          {gallery.subtitle ? <div><strong>Subtitle:</strong> {gallery.subtitle}</div> : null}
          {gallery.location ? <div><strong>Location:</strong> {gallery.location}</div> : null}
        </div>
        {gallery.notes ? <p className="muted-text">{gallery.notes}</p> : null}
      </section>

      <section className="card">
        <h2>Rooms</h2>
        {rooms.length === 0 ? (
          <div className="notice">No rooms defined.</div>
        ) : (
          <div className="stack-md">
            {rooms.map((room) => (
              <div key={room.id} className="subcard">
                <div className="subcard-header">
                  <h3>{room.name}</h3>
                  <div className="mini-meta">{room.id}</div>
                </div>

                <div className="detail-grid">
                  <div><strong>Width:</strong> {room.width_ft} ft</div>
                  <div><strong>Depth:</strong> {room.height_ft} ft</div>
                  <div><strong>Ceiling Height:</strong> {room.ceiling_height_ft} ft</div>
                </div>

                {room.notes ? <p className="muted-text">{room.notes}</p> : null}

                <div className="stack-sm">
                  <h4>Walls</h4>
                  {(room.walls || []).length === 0 ? (
                    <div className="notice">No walls defined for this room.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Label</th>
                            <th>Orientation</th>
                            <th>Length</th>
                            <th>Height</th>
                            <th>Displayable</th>
                            <th>Hang Y</th>
                            <th>Finish</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(room.walls || []).map((wall) => (
                            <tr key={wall.id}>
                              <td>{wall.id}</td>
                              <td>{wall.label}</td>
                              <td>{wall.orientation}</td>
                              <td>{wall.length_ft} ft</td>
                              <td>{wall.height_ft} ft</td>
                              <td>{wall.displayable ? 'Yes' : 'No'}</td>
                              <td>{wall.default_hang_y_ft} ft</td>
                              <td>{wall.finish || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Doors</h2>
        {doors.length === 0 ? (
          <div className="notice">No doors defined.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Width</th>
                  <th>Height</th>
                  <th>Endpoint A</th>
                  <th>Endpoint B</th>
                </tr>
              </thead>
              <tbody>
                {doors.map((door) => (
                  <tr key={door.id}>
                    <td>{door.id}</td>
                    <td>{door.name}</td>
                    <td>{door.type}</td>
                    <td>{door.width_ft} ft</td>
                    <td>{door.height_ft} ft</td>
                    <td>
                      {door.endpoint_a?.room_id} / {door.endpoint_a?.wall_id} @ {door.endpoint_a?.offset_ft} ft
                    </td>
                    <td>
                      {door.endpoint_b?.room_id} / {door.endpoint_b?.wall_id} @ {door.endpoint_b?.offset_ft} ft
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Windows</h2>
        {windows.length === 0 ? (
          <div className="notice">No windows defined.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Room</th>
                  <th>Wall</th>
                  <th>Width</th>
                  <th>Height</th>
                  <th>Sill Height</th>
                  <th>Offset</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((win) => (
                  <tr key={win.id}>
                    <td>{win.id}</td>
                    <td>{win.name}</td>
                    <td>{win.room_id}</td>
                    <td>{win.wall_id}</td>
                    <td>{win.width_ft} ft</td>
                    <td>{win.height_ft} ft</td>
                    <td>{win.sill_height_ft} ft</td>
                    <td>{win.offset_ft} ft</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {gallery.layout_defaults ? (
        <section className="card">
          <h2>Layout Defaults</h2>
          <div className="detail-grid">
            <div><strong>Min Gap:</strong> {gallery.layout_defaults.min_gap_ft} ft</div>
            <div><strong>Ideal Gap:</strong> {gallery.layout_defaults.ideal_gap_ft} ft</div>
            <div><strong>Max Gap:</strong> {gallery.layout_defaults.max_gap_ft} ft</div>
            <div><strong>Snap Grid:</strong> {gallery.layout_defaults.snap_to_grid_ft} ft</div>
            <div><strong>No Overlap:</strong> {gallery.layout_defaults.no_overlap ? 'Yes' : 'No'}</div>
            <div><strong>Stay Within Space:</strong> {gallery.layout_defaults.stay_within_space ? 'Yes' : 'No'}</div>
            <div><strong>Allow Vertical Offset:</strong> {gallery.layout_defaults.allow_vertical_offset ? 'Yes' : 'No'}</div>
            <div><strong>Allow Stacking:</strong> {gallery.layout_defaults.allow_stacking ? 'Yes' : 'No'}</div>
          </div>
        </section>
      ) : null}
    </div>
  );
}