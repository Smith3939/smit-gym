import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-smit-gym';

function futureTimestamp(days) {
  return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
}

function pastTimestamp(days = 1) {
  return Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe('firestore security rules', { concurrency: false }, () => {
  /** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment | undefined} */
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  function dbFor(uid) {
    const ctx = uid
      ? testEnv.authenticatedContext(uid)
      : testEnv.unauthenticatedContext();
    return ctx.firestore();
  }

  async function seed(path, data) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), path), data);
    });
  }

  async function assertDenied(promise) {
    const error = await assertFails(promise);
    const code = String(error.code || '');
    assert.ok(
      code === 'permission-denied' || code.endsWith('/permission-denied'),
      `expected permission-denied, got ${code}: ${error.message}`,
    );
  }

  test('invite code can be read by exact id, but listing every code is denied', async () => {
    await seed('inviteCodes/SMIT-AAAAAA', {
      coachUid: 'coach',
      coachName: 'מאמן',
      usedBy: null,
      expiresAt: futureTimestamp(7),
    });
    await seed('inviteCodes/SMIT-BBBBBB', {
      coachUid: 'other-coach',
      coachName: 'אחר',
      usedBy: null,
      expiresAt: futureTimestamp(7),
    });

    const trainee = dbFor('trainee');
    await assertSucceeds(getDoc(doc(trainee, 'inviteCodes/SMIT-AAAAAA')));
    await assertDenied(getDocs(collection(trainee, 'inviteCodes')));

    const coach = dbFor('coach');
    const ownCodes = await assertSucceeds(getDocs(query(
      collection(coach, 'inviteCodes'),
      where('coachUid', '==', 'coach'),
    )));
    assert.equal(ownCodes.size, 1);
    await assertDenied(getDocs(query(
      collection(coach, 'inviteCodes'),
      where('coachUid', '==', 'other-coach'),
    )));
  });

  test('an expired code cannot be redeemed, and a used code cannot be redeemed twice', async () => {
    await seed('inviteCodes/SMIT-EXPIRED', {
      coachUid: 'coach',
      usedBy: null,
      expiresAt: pastTimestamp(1),
    });
    await seed('inviteCodes/SMIT-FRESH', {
      coachUid: 'coach',
      usedBy: null,
      expiresAt: futureTimestamp(3),
    });
    await seed('inviteCodes/SMIT-STRING', {
      coachUid: 'coach',
      usedBy: null,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const trainee = dbFor('trainee');
    await assertDenied(updateDoc(doc(trainee, 'inviteCodes/SMIT-EXPIRED'), { usedBy: 'trainee' }));
    await assertDenied(updateDoc(doc(trainee, 'inviteCodes/SMIT-STRING'), { usedBy: 'trainee' }));
    await assertDenied(updateDoc(doc(dbFor('coach'), 'inviteCodes/SMIT-FRESH'), { usedBy: 'coach' }));

    await assertSucceeds(updateDoc(doc(trainee, 'inviteCodes/SMIT-FRESH'), { usedBy: 'trainee' }));
    await assertDenied(updateDoc(doc(dbFor('other'), 'inviteCodes/SMIT-FRESH'), { usedBy: 'other' }));
  });

  test('a coach cannot create a code that is already used or expires too late', async () => {
    const coach = dbFor('coach');
    await assertSucceeds(setDoc(doc(coach, 'inviteCodes/SMIT-NEWONE'), {
      coachUid: 'coach',
      coachName: 'מאמן',
      usedBy: null,
      expiresAt: futureTimestamp(7),
    }));
    await assertDenied(setDoc(doc(coach, 'inviteCodes/SMIT-USEDUP'), {
      coachUid: 'coach',
      usedBy: 'someone',
      expiresAt: futureTimestamp(7),
    }));
    await assertDenied(setDoc(doc(coach, 'inviteCodes/SMIT-TOLONG'), {
      coachUid: 'coach',
      usedBy: null,
      expiresAt: futureTimestamp(30),
    }));
  });

  test('a coachLink requires a matching redeemed code, and the coach cannot rewrite it', async () => {
    await seed('users/trainee', { name: 'מתאמן' });
    await seed('users/trainee/workoutLogs/w1', { note: 'private' });
    await seed('inviteCodes/SMIT-VALID1', {
      coachUid: 'coach',
      coachName: 'מאמן',
      usedBy: null,
      expiresAt: futureTimestamp(5),
    });
    await seed('inviteCodes/SMIT-OTHER1', {
      coachUid: 'other-coach',
      coachName: 'אחר',
      usedBy: null,
      expiresAt: futureTimestamp(5),
    });

    const trainee = dbFor('trainee');

    await assertDenied(setDoc(doc(trainee, 'coachLinks/no-code'), {
      coachUid: 'coach',
      traineeUid: 'trainee',
      status: 'active',
      inviteCode: 'SMIT-VALID1',
      permissions: { workouts: true },
    }));

    const mismatch = writeBatch(trainee);
    mismatch.update(doc(trainee, 'inviteCodes/SMIT-OTHER1'), { usedBy: 'trainee' });
    mismatch.set(doc(trainee, 'coachLinks/bad-coach'), {
      coachUid: 'coach',
      traineeUid: 'trainee',
      status: 'active',
      inviteCode: 'SMIT-OTHER1',
      permissions: { workouts: true },
    });
    await assertDenied(mismatch.commit());

    const batch = writeBatch(trainee);
    const linkRef = doc(collection(trainee, 'coachLinks'));
    batch.update(doc(trainee, 'inviteCodes/SMIT-VALID1'), { usedBy: 'trainee' });
    batch.set(linkRef, {
      coachUid: 'coach',
      traineeUid: 'trainee',
      traineeName: 'מתאמן',
      status: 'active',
      inviteCode: 'SMIT-VALID1',
      permissions: { workouts: true, nutrition: true },
    });
    batch.update(doc(trainee, 'users/trainee'), {
      coachUid: 'coach',
      coachLinkId: linkRef.id,
    });
    await assertSucceeds(batch.commit());

    const coach = dbFor('coach');
    await assertSucceeds(getDoc(doc(coach, 'users/trainee')));
    await assertSucceeds(getDoc(doc(coach, 'users/trainee/workoutLogs/w1')));

    await assertDenied(updateDoc(doc(coach, 'coachLinks', linkRef.id), {
      coachUid: 'someone-else',
    }));
    await assertDenied(updateDoc(doc(coach, 'coachLinks', linkRef.id), {
      traineeUid: 'someone-else',
    }));
    await assertDenied(updateDoc(doc(coach, 'coachLinks', linkRef.id), {
      permissions: { workouts: false },
    }));

    await assertSucceeds(updateDoc(doc(trainee, 'coachLinks', linkRef.id), {
      permissions: { workouts: false, nutrition: true },
    }));
  });

  test('an ended link cannot be re-activated, and the coach loses trainee access', async () => {
    await seed('users/trainee', {
      name: 'מתאמן',
      coachUid: 'coach',
      coachLinkId: 'link1',
    });
    await seed('users/trainee/workoutLogs/w1', { note: 'private' });
    await seed('coachLinks/link1', {
      coachUid: 'coach',
      traineeUid: 'trainee',
      status: 'active',
      inviteCode: 'SMIT-OLDONE',
      permissions: { workouts: true },
    });

    const coach = dbFor('coach');
    const trainee = dbFor('trainee');
    await assertSucceeds(getDoc(doc(coach, 'users/trainee')));

    await assertSucceeds(updateDoc(doc(trainee, 'coachLinks/link1'), {
      status: 'ended',
      endedAt: Timestamp.now(),
    }));

    // coachUid is still on the trainee doc on purpose: access must follow the link.
    await assertDenied(getDoc(doc(coach, 'users/trainee')));
    await assertDenied(getDoc(doc(coach, 'users/trainee/workoutLogs/w1')));
    await assertSucceeds(getDoc(doc(trainee, 'users/trainee')));

    await assertDenied(updateDoc(doc(coach, 'coachLinks/link1'), { status: 'active' }));
    await assertDenied(updateDoc(doc(trainee, 'coachLinks/link1'), {
      status: 'active',
      endedAt: null,
    }));
  });

  test('a coachLink that belongs to a different trainee does not grant access', async () => {
    await seed('users/trainee', {
      name: 'מתאמן',
      coachUid: 'coach',
      coachLinkId: 'someone-elses-link',
    });
    await seed('coachLinks/someone-elses-link', {
      coachUid: 'coach',
      traineeUid: 'other-trainee',
      status: 'active',
      inviteCode: 'SMIT-OTHER2',
    });

    await assertDenied(getDoc(doc(dbFor('coach'), 'users/trainee')));
  });

  test('shared profiles: anonymous get works, listing and expired links do not', async () => {
    const owner = dbFor('owner');
    await assertSucceeds(setDoc(doc(owner, 'sharedProfiles/share-live'), {
      ownerId: 'owner',
      status: 'active',
      expiresAt: futureTimestamp(30),
    }));
    await assertDenied(setDoc(doc(owner, 'sharedProfiles/share-off'), {
      ownerId: 'owner',
      status: 'disabled',
      expiresAt: futureTimestamp(30),
    }));
    await assertDenied(setDoc(doc(owner, 'sharedProfiles/share-string'), {
      ownerId: 'owner',
      status: 'active',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }));

    await seed('sharedProfiles/share-expired', {
      ownerId: 'owner',
      status: 'active',
      expiresAt: pastTimestamp(2),
    });

    const anon = dbFor(null);
    await assertSucceeds(getDoc(doc(anon, 'sharedProfiles/share-live')));
    await assertDenied(getDoc(doc(anon, 'sharedProfiles/share-expired')));
    await assertDenied(getDocs(collection(anon, 'sharedProfiles')));
    await assertDenied(getDocs(collection(owner, 'sharedProfiles')));
  });

  test('public profiles reject exact location and accept a short geohash5', async () => {
    const user = dbFor('user1');
    await assertDenied(setDoc(doc(user, 'publicProfiles/user1'), {
      name: 'דנה',
      location: { lat: 32.08, lng: 34.78 },
    }));
    await assertDenied(setDoc(doc(user, 'publicProfiles/user1'), {
      name: 'דנה',
      geohash5: 'sv8wrr',
    }));
    await assertSucceeds(setDoc(doc(user, 'publicProfiles/user1'), {
      name: 'דנה',
      city: 'תל אביב',
      geohash5: 'sv8wr',
    }));
    await assertSucceeds(setDoc(doc(user, 'publicProfiles/user1'), {
      name: 'דנה',
      city: 'תל אביב',
    }));
    await assertDenied(setDoc(doc(dbFor('user2'), 'publicProfiles/user1'), {
      name: 'גנוב',
    }));

    await seed('publicProfiles/user1', {
      name: 'דנה',
      location: { lat: 32.08, lng: 34.78 },
    });
    await assertDenied(updateDoc(doc(user, 'publicProfiles/user1'), { name: 'דנה ב' }));
    await assertSucceeds(updateDoc(doc(user, 'publicProfiles/user1'), {
      name: 'דנה ב',
      geohash5: 'sv8wr',
      location: deleteField(),
    }));
    const stored = await assertSucceeds(getDoc(doc(user, 'publicProfiles/user1')));
    assert.equal(stored.data().location, undefined);
    assert.equal(stored.data().geohash5, 'sv8wr');
  });
});
