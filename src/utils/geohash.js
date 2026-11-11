/**
 * Tiny geohash encode/decode (no dependencies).
 * Precision 5 is a cell of about 4.9 km × 4.9 km — coarse enough for a
 * "within 25 km" search without storing an exact GPS fix.
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encode(lat, lng, precision = 5) {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        idx = idx * 2 + 1;
        lngMin = mid;
      } else {
        idx *= 2;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        idx = idx * 2 + 1;
        latMin = mid;
      } else {
        idx *= 2;
        latMax = mid;
      }
    }
    evenBit = !evenBit;
    bit += 1;
    if (bit === 5) {
      geohash += BASE32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/** Center of the geohash cell, or null if the hash is missing/invalid. */
export function decodeCenter(hash) {
  if (!hash || typeof hash !== 'string') return null;
  const normalized = hash.trim().toLowerCase();
  if (!normalized) return null;

  let evenBit = true;
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  for (let i = 0; i < normalized.length; i += 1) {
    const idx = BASE32.indexOf(normalized.charAt(i));
    if (idx === -1) return null;
    for (let n = 4; n >= 0; n -= 1) {
      const bitN = (idx >> n) & 1;
      if (evenBit) {
        const mid = (lngMin + lngMax) / 2;
        if (bitN === 1) lngMin = mid;
        else lngMax = mid;
      } else {
        const mid = (latMin + latMax) / 2;
        if (bitN === 1) latMin = mid;
        else latMax = mid;
      }
      evenBit = !evenBit;
    }
  }

  return {
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
  };
}

// Cover the spherical search bounds with precision-four cells. The caller
// applies the actual distance filter to the returned coarse cell centers.
export function nearbyPrefixes({ lat, lng }, km = 25) {
  const radians = Math.PI / 180;
  const angular = km / 6371;
  const latitudeDelta = angular / radians;
  const longitudeDelta = Math.abs(lat) + latitudeDelta >= 90
    ? 180 : Math.asin(Math.min(1, Math.sin(angular) / Math.cos(lat * radians))) / radians;
  const height = 180 / 1024;
  const width = 360 / 1024;
  const startY = Math.max(0, Math.floor((lat - latitudeDelta + 90) / height));
  const endY = Math.min(1023, Math.floor((lat + latitudeDelta + 90) / height));
  const startX = Math.floor((lng - longitudeDelta + 180) / width);
  const endX = Math.floor((lng + longitudeDelta + 180) / width);
  const prefixes = new Set();
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const wrapped = ((x % 1024) + 1024) % 1024;
      prefixes.add(encode((y + 0.5) * height - 90, (wrapped + 0.5) * width - 180, 4));
    }
  }
  // At extreme latitudes, group the same cells into broader prefixes.
  return prefixes.size > 40 ? [...new Set([...prefixes].map(p => p.slice(0, 2)))] : [...prefixes];
}
