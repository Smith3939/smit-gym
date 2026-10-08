/**
 * Coach module — the coach ↔ trainee relationship.
 *
 * Model (see docs/COACH_SPEC.md):
 *  - A coach issues a one-time invite code.
 *  - The trainee redeems it and explicitly approves; only then does the link
 *    become active and `users/{traineeUid}.coachUid` get set.
 *  - Rules allow the coach to read the trainee only while `coachUid` matches
 *    and `coachLinkId` points at an active coachLinks doc for that pair.
 *  - Either side can end the link at any time.
 *
 * Phase 1 is read-only for the coach (dashboard + progress). Plan editing
 * lands in phase 2 via users/{uid}/coachPlans.
 */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CODE_TTL_DAYS = 7;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — easier to read aloud

export const DEFAULT_PERMISSIONS = {
  workouts: true,
  nutrition: true,
  metrics: true,
  notes: true,
};

export const PERMISSION_LABELS = {
  workouts: 'לראות ולערוך תוכנית אימונים',
  nutrition: 'לראות ולערוך תפריט',
  metrics: 'לראות משקל והתקדמות',
  notes: 'לכתוב הערות אישיות',
};

/* ── Coach side ─────────────────────────────────────────────────────────── */

/** Turn on coach mode and publish a minimal coach profile. */
export async function enableCoachMode(uid, profile = {}) {
  await Promise.all([
    updateDoc(doc(db, 'users', uid), { isCoach: true }),
    setDoc(doc(db, 'coachProfiles', uid), {
      name: profile.name || '',
      photo: profile.photo || null,
      gymName: profile.gymName || '',
      bio: profile.bio || '',
      updatedAt: serverTimestamp(),
    }, { merge: true }),
  ]);
}

export async function disableCoachMode(uid) {
  await updateDoc(doc(db, 'users', uid), { isCoach: false });
}

function randomCode(length = 6) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Create a one-time invite code. Retries on the (unlikely) collision so we
 * never hand out a code that already points at another coach.
 */
export async function createInviteCode(coachUid, coachName) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CODE_TTL_DAYS);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `SMIT-${randomCode(6)}`;
    const ref = doc(db, 'inviteCodes', code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    // Timestamp, not an ISO string: rules reject anything else, and cap expiry at 8 days.
    await setDoc(ref, {
      coachUid,
      coachName: coachName || '',
      usedBy: null,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
    });
    return { code, expiresAt };
  }
  throw new Error('COULD_NOT_ALLOCATE_CODE');
}

/** Active links for a coach, enriched with each trainee's summary. */
export async function getMyTrainees(coachUid) {
  const snap = await getDocs(query(
    collection(db, 'coachLinks'),
    where('coachUid', '==', coachUid),
    where('status', '==', 'active'),
  ));

  const links = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return Promise.all(links.map(async (link) => ({
    link,
    ...(await getTraineeSummary(link.traineeUid)),
  })));
}

/**
 * Everything the dashboard needs for one trainee: profile, last workout,
 * weight trend, and the derived attention flags.
 */
export async function getTraineeSummary(traineeUid) {
  const [profileSnap, workoutSnap, weightSnap] = await Promise.all([
    getDoc(doc(db, 'users', traineeUid)),
    getDocs(query(
      collection(db, 'users', traineeUid, 'workoutLogs'),
      orderBy('createdAt', 'desc'),
      limit(20),
    )).catch(() => ({ docs: [] })),
    getDocs(query(
      collection(db, 'users', traineeUid, 'weightHistory'),
      orderBy('createdAt', 'desc'),
      limit(10),
    )).catch(() => ({ docs: [] })),
  ]);

  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const workouts = workoutSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const weights = weightSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    uid: traineeUid,
    profile,
    workouts,
    weights,
    ...deriveStatus({ profile, workouts, weights }),
  };
}

function toDate(ts) {
  if (!ts) return null;
  if (typeof ts?.seconds === 'number') return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

const daysSince = (date) =>
  date ? Math.floor((Date.now() - date.getTime()) / 86400000) : null;

/**
 * Turn raw logs into the "needs attention" signals the dashboard sorts by.
 * Kept pure so it's easy to reason about and to tune later.
 */
export function deriveStatus({ profile = {}, workouts = [], weights = [] }) {
  const flags = [];

  const lastWorkoutAt = toDate(workouts[0]?.createdAt);
  const daysSinceWorkout = daysSince(lastWorkoutAt);
  if (daysSinceWorkout === null) {
    flags.push({ level: 'warn', text: 'עדיין לא רשם אימון' });
  } else if (daysSinceWorkout >= 5) {
    flags.push({ level: 'alert', text: `לא התאמן ${daysSinceWorkout} ימים` });
  }

  const lastWeighAt = toDate(weights[0]?.createdAt);
  const daysSinceWeigh = daysSince(lastWeighAt);
  if (daysSinceWeigh !== null && daysSinceWeigh >= 14) {
    flags.push({ level: 'warn', text: `לא נשקל ${daysSinceWeigh} ימים` });
  }

  // Weight moving against the stated goal
  let weightDelta = null;
  if (weights.length >= 2) {
    const newest = Number(weights[0].weight);
    const oldest = Number(weights[weights.length - 1].weight);
    if (Number.isFinite(newest) && Number.isFinite(oldest)) {
      weightDelta = Math.round((newest - oldest) * 10) / 10;
      const goal = profile.goal;
      if (goal === 'cut' && weightDelta >= 1) {
        flags.push({ level: 'alert', text: `עלה ${weightDelta} ק״ג במטרת חיטוב` });
      } else if (goal === 'bulk' && weightDelta <= -1) {
        flags.push({ level: 'alert', text: `ירד ${Math.abs(weightDelta)} ק״ג במטרת מסה` });
      }
    }
  }

  const workoutsThisWeek = workouts.filter((w) => {
    const d = toDate(w.createdAt);
    return d && Date.now() - d.getTime() <= 7 * 86400000;
  }).length;

  return {
    flags,
    needsAttention: flags.some((f) => f.level === 'alert'),
    daysSinceWorkout,
    workoutsThisWeek,
    weightDelta,
    currentWeight: weights[0]?.weight ?? profile.weight ?? null,
  };
}

/* ── Trainee side ───────────────────────────────────────────────────────── */

/**
 * Legacy codes stored an ISO string. Rules now require a Timestamp and treat
 * those old codes as expired, so the client does too.
 */
function inviteStillValid(expiresAt) {
  if (!expiresAt || typeof expiresAt === 'string') return false;
  const millis = typeof expiresAt.toMillis === 'function'
    ? expiresAt.toMillis()
    : (typeof expiresAt.seconds === 'number' ? expiresAt.seconds * 1000 : null);
  return millis != null && millis > Date.now();
}

/**
 * Look up a code without consuming it — the trainee sees who is asking and
 * what they'd get access to before deciding.
 */
export async function lookupInviteCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, reason: 'EMPTY' };

  const snap = await getDoc(doc(db, 'inviteCodes', code));
  if (!snap.exists()) return { ok: false, reason: 'NOT_FOUND' };

  const data = snap.data();
  if (data.usedBy) return { ok: false, reason: 'ALREADY_USED' };
  if (!inviteStillValid(data.expiresAt)) return { ok: false, reason: 'EXPIRED' };
  return { ok: true, code, coachUid: data.coachUid, coachName: data.coachName };
}

/**
 * Accept the invite in one batch. Rules check the code with getAfter(), so
 * burning the code and creating the link have to commit together.
 */
export async function acceptInvite({ code, coachUid, traineeUid, traineeName, permissions }) {
  const perms = { ...DEFAULT_PERMISSIONS, ...(permissions || {}) };
  const linkRef = doc(collection(db, 'coachLinks'));
  const batch = writeBatch(db);

  batch.update(doc(db, 'inviteCodes', code), { usedBy: traineeUid });
  batch.set(linkRef, {
    coachUid,
    traineeUid,
    traineeName: traineeName || '',
    status: 'active',
    permissions: perms,
    inviteCode: code,
    createdAt: serverTimestamp(),
    acceptedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', traineeUid), {
    coachUid,
    coachLinkId: linkRef.id,
  });

  await batch.commit();
  return linkRef.id;
}

export async function getMyCoach(traineeUid) {
  const userSnap = await getDoc(doc(db, 'users', traineeUid));
  const coachUid = userSnap.exists() ? userSnap.data().coachUid : null;
  if (!coachUid) return null;

  const coachSnap = await getDoc(doc(db, 'coachProfiles', coachUid));
  return {
    uid: coachUid,
    linkId: userSnap.data().coachLinkId || null,
    ...(coachSnap.exists() ? coachSnap.data() : {}),
  };
}

/**
 * Either side can end it. The link write is only `status` and `endedAt`
 * (rules reject any other field, and an ended link cannot be re-activated).
 * The trainee keeps whatever the coach built.
 */
export async function endCoachLink({ linkId, traineeUid }) {
  if (linkId) {
    await updateDoc(doc(db, 'coachLinks', linkId), {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  }
  if (traineeUid) {
    await updateDoc(doc(db, 'users', traineeUid), {
      coachUid: null,
      coachLinkId: null,
    });
  }
}
