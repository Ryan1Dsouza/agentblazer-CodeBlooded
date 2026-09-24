export const FROST_CAMERA = {
  distance: 7.5,
  height: 2.8,
  lookAhead: 4,
  lookHeight: 0.8,
  fov: 60,
  boostPullback: 1.8,
  boostFov: 7,
} as const;

/** Dolly along the viewing angle so acceleration never changes the chase camera's pitch. */
export function getFrostCameraRig(boost: number) {
  const amount = Math.max(0, Math.min(1, boost));
  const distance = FROST_CAMERA.distance + amount * FROST_CAMERA.boostPullback;
  const pitchSlope = (FROST_CAMERA.height - FROST_CAMERA.lookHeight)
    / (FROST_CAMERA.distance + FROST_CAMERA.lookAhead);

  return {
    distance,
    height: FROST_CAMERA.lookHeight + pitchSlope * (distance + FROST_CAMERA.lookAhead),
    lookAhead: FROST_CAMERA.lookAhead,
    lookHeight: FROST_CAMERA.lookHeight,
    fov: FROST_CAMERA.fov + amount * FROST_CAMERA.boostFov,
  };
}
