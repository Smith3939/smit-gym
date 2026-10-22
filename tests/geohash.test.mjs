import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

async function loadGeohash() {
  const source = readFileSync(new URL('../src/utils/geohash.js', import.meta.url), 'utf8');
  const href = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
  return import(href);
}

const { encode, decodeCenter } = await loadGeohash();

test('precision 5 matches the well-known ezs42 vector', () => {
  assert.equal(encode(42.6, -5.6, 5), 'ezs42');
});

test('precision 5 is five characters and a longer hash extends it', () => {
  const hash = encode(32.0853, 34.7818, 5);
  assert.equal(hash.length, 5);
  assert.equal(encode(32.0853, 34.7818, 6).startsWith(hash), true);
});

test('decodeCenter lands inside the same ~5 km cell', () => {
  const lat = 32.0853;
  const lng = 34.7818;
  const center = decodeCenter(encode(lat, lng, 5));
  assert.ok(center);
  // Half-diagonal of a precision-5 cell is about 3.5 km. 0.05° is ~5 km.
  assert.ok(Math.abs(center.lat - lat) < 0.05);
  assert.ok(Math.abs(center.lng - lng) < 0.05);
  assert.equal(encode(center.lat, center.lng, 5), encode(lat, lng, 5));
});

test('decodeCenter rejects empty and invalid hashes', () => {
  assert.equal(decodeCenter(''), null);
  assert.equal(decodeCenter(null), null);
  assert.equal(decodeCenter('ezs4!'), null);
});
