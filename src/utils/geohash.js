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
