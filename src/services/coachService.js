/**
 * Coach module — the coach ↔ trainee relationship.
 *
 * Model (see docs/COACH_SPEC.md):
 *  - A coach issues a one-time invite code.
 *  - The trainee redeems it and explicitly approves; only then does the link
 *    become active and `users/{traineeUid}.coachUid` get set.
 *  - `coachUid` on the trainee doc is what the security rules check, so the
 *    rule is a single unambiguous lookup.
 *  - Either side can end the link at any time.
 *
 * Phase 1 is read-only for the coach (dashboard + progress). Plan editing
 * lands in phase 2 via users/{uid}/coachPlans.
 */

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp,
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

function randomCode(length = 4) {
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
    const code = `SMIT-${randomCode()}`;
    const ref = doc(db, 'inviteCodes', code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    await setDoc(ref, {
      coachUid,
      coachName: coachName || '',
      usedBy: null,
      expiresAt: expiresAt.toISOString(),
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
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return { ok: false, reason: 'EXPIRED' };
  }
  return { ok: true, code, coachUid: data.coachUid, coachName: data.coachName };
}

/** Accept the invite: create the link, stamp the trainee, burn the code. */
export async function acceptInvite({ code, coachUid, traineeUid, traineeName, permissions }) {
  const perms = { ...DEFAULT_PERMISSIONS, ...(permissions || {}) };

  const linkRef = await addDoc(collection(db, 'coachLinks'), {
    coachUid,
    traineeUid,
    traineeName: traineeName || '',
    status: 'active',
    permissions: perms,
    createdAt: serverTimestamp(),
    acceptedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'users', traineeUid), {
    coachUid,
    coachLinkId: linkRef.id,
  });

  await updateDoc(doc(db, 'inviteCodes', code), { usedBy: traineeUid });

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

/** Either side can end it. The trainee keeps whatever the coach built. */
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
