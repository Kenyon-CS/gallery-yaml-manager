function getCurrentUser() {
  return localStorage.getItem('user') || '';
}

function withUser(url) {
  const user = getCurrentUser();
  if (!user) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}user=${encodeURIComponent(user)}`;
}

async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

export async function fetchArtworks(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });

  const query = params.toString();
  const response = await fetch(withUser(`/api/art${query ? `?${query}` : ''}`));
  return parseResponse(response);
}

export async function fetchArtwork(id) {
  const response = await fetch(withUser(`/api/art/${id}`));
  return parseResponse(response);
}

export async function fetchVocabularies() {
  const response = await fetch(withUser('/api/art/vocabularies'));
  return parseResponse(response);
}

export async function createArtwork(payload) {
  const response = await fetch(withUser('/api/art'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function updateArtwork(id, payload) {
  const response = await fetch(withUser(`/api/art/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function deleteArtwork(id) {
  const response = await fetch(withUser(`/api/art/${id}`), {
    method: 'DELETE'
  });
  return parseResponse(response);
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/uploads/image', {
    method: 'POST',
    body: formData
  });

  return parseResponse(response);
}

export async function fetchAllData() {
  const response = await fetch(withUser('/api/data/all'));
  return parseResponse(response);
}

export async function fetchResolvedArrangement(id) {
  const response = await fetch(withUser(`/api/data/resolved-arrangements/${id}`));
  return parseResponse(response);
}

export async function fetchGallery() {
  const response = await fetch(withUser('/api/gallery'));
  return parseResponse(response);
}

export async function fetchGalleryRooms() {
  const response = await fetch(withUser('/api/gallery/rooms'));
  return parseResponse(response);
}

export async function fetchGalleryDoors() {
  const response = await fetch(withUser('/api/gallery/doors'));
  return parseResponse(response);
}

export async function fetchGalleryWindows() {
  const response = await fetch(withUser('/api/gallery/windows'));
  return parseResponse(response);
}