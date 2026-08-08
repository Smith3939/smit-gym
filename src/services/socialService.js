/**
 * Social Service - the fitness social network layer.
 *
 * Data model (Firestore):
 * - publicProfiles/{uid}  - what other users may see (name, photo, gym, city, location)
 * - posts/{postId}        - feed posts (text / shared workout / shared meal, optional image)
 * - posts/{postId}/likes/{uid} - one doc per liking user
 * - buddyRequests/{id}    - workout-buddy requests between users
 *
 * Images are compressed client-side and stored as small base64 data-URIs
 * (no Firebase Storage needed for the beta).
 */

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, getCountFromServer,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { db } from '../config/firebase';

// ─── Public profiles ────────────────────────────────────────────────────────

/**
 * Create/update the public part of a user's profile.
 * Call whenever the private profile changes (name, gym, city, photo...).
 */
export async function upsertPublicProfile(uid, data) {
  await setDoc(doc(db, 'publicProfiles', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getPublicProfile(uid) {
  const snap = await getDoc(doc(db, 'publicProfiles', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

/** All public profiles for the "discover people" screen (fine for beta scale). */
export async function getAllPublicProfiles(max = 100) {
  const snap = await getDocs(query(collection(db, 'publicProfiles'), limit(max)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

// ─── Posts / feed ───────────────────────────────────────────────────────────

/**
 * @param {object} post - { uid, authorName, authorPhoto, text, image, type, payload }
 *   type: 'text' | 'workout' | 'meal'
 *   payload: structured data for shared workouts/meals
 */
export async function createPost(post) {
  const ref = await addDoc(collection(db, 'posts'), {
    ...post,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, 'posts', postId));
}

export async function getFeedPosts(max = 50) {
  const snap = await getDocs(
    query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserPosts(uid, max = 60) {
  const snap = await getDocs(
    query(collection(db, 'posts'), where('uid', '==', uid), limit(max))
  );
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort client-side (avoids a composite index requirement)
  posts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return posts;
}

// ─── Likes ──────────────────────────────────────────────────────────────────

export async function toggleLike(postId, uid) {
  const likeRef = doc(db, 'posts', postId, 'likes', uid);
  const existing = await getDoc(likeRef);
  if (existing.exists()) {
    await deleteDoc(likeRef);
    return false;
  }
  await setDoc(likeRef, { createdAt: serverTimestamp() });
  return true;
}

/** Returns { count, isLiked } for one post. */
export async function getLikeInfo(postId, uid) {
  const likesCol = collection(db, 'posts', postId, 'likes');
  const [countSnap, mySnap] = await Promise.all([
    getCountFromServer(likesCol),
    getDoc(doc(likesCol, uid)),
  ]);
  return { count: countSnap.data().count, isLiked: mySnap.exists() };
}

// ─── Buddy requests (workout partners) ──────────────────────────────────────

export async function sendBuddyRequest(from, to) {
  // Avoid duplicate pending requests in either direction.
  // (Two provable queries - security rules only let us read requests we're part of.)
  const key = pairKey(from.uid, to.uid);
  const [mine, theirs] = await Promise.all([
    getDocs(query(collection(db, 'buddyRequests'),
      where('pairKey', '==', key), where('fromUid', '==', from.uid))),
    getDocs(query(collection(db, 'buddyRequests'),
      where('pairKey', '==', key), where('toUid', '==', from.uid))),
  ]);
  const open = [...mine.docs, ...theirs.docs].find((d) => d.data().status !== 'declined');
  if (open) return { alreadyExists: true, id: open.id, status: open.data().status };

  const ref = await addDoc(collection(db, 'buddyRequests'), {
    fromUid: from.uid,
    fromName: from.name || '',
    fromPhoto: from.photo || null,
    toUid: to.uid,
    toName: to.name || '',
    pairKey: pairKey(from.uid, to.uid),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return { alreadyExists: false, id: ref.id, status: 'pending' };
}

function pairKey(a, b) {
  return [a, b].sort().join('_');
}

export async function getIncomingRequests(uid) {
  const snap = await getDocs(query(
    collection(db, 'buddyRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending'),
  ));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** All accepted + pending requests involving me (to label people in discovery). */
export async function getMyBuddyLinks(uid) {
  const [asFrom, asTo] = await Promise.all([
    getDocs(query(collection(db, 'buddyRequests'), where('fromUid', '==', uid))),
    getDocs(query(collection(db, 'buddyRequests'), where('toUid', '==', uid))),
  ]);
  return [...asFrom.docs, ...asTo.docs].map((d) => ({ id: d.id, ...d.data() }));
}

export async function respondToBuddyRequest(requestId, status) {
  await updateDoc(doc(db, 'buddyRequests', requestId), { status });
}

// ─── Images (pick + compress to base64 data-URI) ────────────────────────────

/**
 * Open the image library, compress the chosen photo and return a small
 * base64 data-URI (or null if cancelled). Fits Firestore's 1MB doc limit.
 */
export async function pickAndCompressImage({ maxWidth = 520, quality = 0.5 } = {}) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1,
  });
  if (result.canceled || !result.assets?.length) return null;

  let q = quality;
  for (let attempt = 0; attempt < 3; attempt++) {
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: maxWidth } }],
      { compress: q, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    const dataUri = `data:image/jpeg;base64,${manipulated.base64}`;
    // Keep a comfortable margin under Firestore's 1MB document limit. Smaller
    // payloads also make publishing noticeably faster on mobile connections.
    if (dataUri.length < 450_000) return dataUri;
    q = q * 0.6;
  }
  return null;
}

// ─── Location ───────────────────────────────────────────────────────────────

/** Ask for permission and return { lat, lng } or null. Works on web + native. */
export async function getCurrentLocation() {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/** Distance in km between two { lat, lng } points (haversine). */
export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
