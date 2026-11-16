import assert from 'node:assert/strict';
import test from 'node:test';
import { EXERCISES } from '../src/data/exercises.js';
import { EXERCISE_ILLUSTRATIONS } from '../src/data/exerciseIllustrations.js';

test('every exercise that can be selected from the catalog has a usable guide', () => {
  for (const exercise of Object.values(EXERCISES).flat()) {
    const guide = EXERCISE_ILLUSTRATIONS[exercise.id];
    assert.ok(guide?.start && guide.cue, exercise.id);
    assert.ok(guide.poses.length === 1 || (guide.poses.length === 2 && guide.end), exercise.id);
    for (const pose of guide.poses) {
      assert.equal(pose.head.length, 2, exercise.id);
      assert.match(pose.body, /^M/, exercise.id);
    }
  }
});
