/**
 * One-off cleanup: drop exact GPS from publicProfiles and store geohash5.
 *
 * Default is dry-run (prints affected document ids only).
 *   node scripts/migrate-coarse-location.mjs
 *   node scripts/migrate-coarse-location.mjs --apply
 *
 * Auth is Application Default Credentials — do not use a service-account key file:
 *   gcloud auth application-default login
 *
 * Project defaults to smith-gymai. Override with GOOGLE_CLOUD_PROJECT.
 */

import { readFileSync } from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const projectId = process.env.GOOGLE_CLOUD_PROJECT
  || process.env.GCLOUD_PROJECT
  || 'smith-gymai';

async function loadGeohash() {
  // src/utils/geohash.js is ESM for the Expo app. This package is not
  // "type": "module", so Node would treat that .js file as CommonJS.
  const source = readFileSync(new URL('../src/utils/geohash.js', import.meta.url), 'utf8');
  const href = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
  return import(href);
}

function readLatLng(location) {
  if (!location || typeof location !== 'object') return null;
  const lat = typeof location.lat === 'number' ? location.lat
    : typeof location.latitude === 'number' ? location.latitude
      : null;
  const lng = typeof location.lng === 'number' ? location.lng
    : typeof location.longitude === 'number' ? location.longitude
      : null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

try {
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
} catch (error) {
  console.error('לא הצלחתי להתחבר ל-Firebase.');
  console.error('הריצו קודם: gcloud auth application-default login');
  console.error(error?.message || error);
  process.exit(1);
}

const { encode } = await loadGeohash();
const db = getFirestore();

console.log(apply
  ? `מעדכן באמת את publicProfiles בפרויקט ${projectId}`
  : `בדיקה בלבד (לא נכתב כלום) בפרויקט ${projectId}. כדי לעדכן באמת הוסיפו --apply`);

const snap = await db.collection('publicProfiles').get();
const affected = [];

for (const profile of snap.docs) {
  const data = profile.data() || {};
  if (data.location == null) continue;
  affected.push(profile.id);

  if (!apply) continue;

  const coords = readLatLng(data.location);
  const update = { location: FieldValue.delete() };
  if (coords) update.geohash5 = encode(coords.lat, coords.lng, 5);
  await profile.ref.update(update);
}

if (affected.length === 0) {
  console.log('אין מסמכים עם שדה location.');
} else {
  for (const id of affected) console.log(id);
  console.log(apply
    ? `עודכנו ${affected.length} מסמכים.`
    : `נמצאו ${affected.length} מסמכים. לא בוצע שינוי.`);
}
