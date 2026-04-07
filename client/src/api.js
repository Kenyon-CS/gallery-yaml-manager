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
    if (value) params.set(key, value);
  });
  const response = await fetch(`/api/artworks?${params.toString()}`);
  return parseResponse(response);
}

export async function fetchArtwork(id) {
  const response = await fetch(`/api/artworks/${id}`);
  return parseResponse(response);
}

export async function fetchVocabularies() {
  const response = await fetch('/api/artworks/vocabularies');
  return parseResponse(response);
}

export async function createArtwork(payload) {
  const response = await fetch('/api/artworks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function updateArtwork(id, payload) {
  const response = await fetch(`/api/artworks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
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
