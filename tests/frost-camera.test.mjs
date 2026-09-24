import test from 'node:test';
import assert from 'node:assert/strict';
import { getFrostCameraRig } from '../src/components/events3D/modes/frost/frostCamera.ts';

const pitch = (rig) => Math.atan2(rig.height - rig.lookHeight, rig.distance + rig.lookAhead);

test('boost pulls the camera back and widens the lens without changing pitch', () => {
  const cruise = getFrostCameraRig(0);
  for (const blend of [0.1, 0.25, 0.5, 0.75, 1]) {
    const boosted = getFrostCameraRig(blend);
    assert.ok(boosted.distance > cruise.distance);
    assert.ok(boosted.fov > cruise.fov && boosted.fov <= 67);
    assert.ok(Math.abs(pitch(boosted) - pitch(cruise)) < 1e-12);
    assert.equal(boosted.lookHeight, cruise.lookHeight);
  }
});

test('releasing boost restores the normal framing; out-of-range input stays bounded', () => {
  assert.deepEqual(getFrostCameraRig(-1), getFrostCameraRig(0));
  assert.deepEqual(getFrostCameraRig(2), getFrostCameraRig(1));
  const cruise = getFrostCameraRig(0);
  assert.equal(cruise.distance, 7.5);
  assert.equal(cruise.height, 2.8);
  assert.equal(cruise.fov, 60);
});
