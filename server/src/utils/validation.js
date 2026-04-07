export function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

export function parseNumber(value, fieldName) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return parsed;
}

export function parseInteger(value, fieldName) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid integer.`);
  }
  return parsed;
}

export function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 'on' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0 || value === undefined) return false;
  return Boolean(value);
}

export function normalizeTagList(value) {
  const values = ensureArray(value)
    .flatMap((item) => {
      if (typeof item === 'string' && item.includes(',')) {
        return item.split(',');
      }
      return [item];
    })
    .map((item) => String(item).trim())
    .filter(Boolean);
  return [...new Set(values)];
}

export function detectOrientation(widthFt, heightFt) {
  if (!widthFt || !heightFt) return 'portrait';
  if (Math.abs(widthFt - heightFt) < 0.01) return 'square';
  return widthFt > heightFt ? 'landscape' : 'portrait';
}
