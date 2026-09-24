import * as THREE from 'three';
import { EnvironmentBuilder, type Point3 } from '../../shared/BakedEnvironmentGeometry';

function orbitalStation(b: EnvironmentBuilder, index: number) {
  const metal = '#76829b';
  const dark = '#292d48';
  const violet = '#b28aff';
  const pale = '#ddd0ff';

  // A faceted asteroid supports a clipped, layered docking deck.
  b.rock([0, -4.5, 0], [9.5, 3.6, 7.8], '#49335e', index * 1.3 + 0.6, 1);
  b.rock([-6.6, -4.8, 2.4], [2.8, 2.1, 2.4], '#362742', 1.2 + index);
  b.rock([5.7, -5.0, -3.8], [3, 2.8, 2.3], '#49345d', 2.4 + index);
  b.add(new THREE.CylinderGeometry(7.8, 8.05, 0.4, 8), dark, { position: [0, -1.18, 0], scale: [1, 1, 0.82] });
  b.add(new THREE.CylinderGeometry(7.5, 7.65, 0.15, 8), '#555574', { position: [0, -0.9, 0], scale: [1, 1, 0.82] });

  b.hull([0, -0.73, -2.15], [5.1, 0.33, 4.5], '#181f35');
  b.hull([0, 0.6, -2.25], [4.7, 2.55, 3.9], metal);
  b.hull([0, 1.99, -2.33], [4.5, 0.29, 3.85], '#acacc2');
  b.box([0, 1.79, -0.46], [3.6, 0.14, 0.2], dark);
  b.add(new THREE.PlaneGeometry(3.35, 0.79), '#192b4d', { position: [0, 1.13, -0.285] }, { unshaded: true });
  b.box([0, 0.65, -0.21], [3.4, 0.046, 0.09], violet, { unshaded: true });
  for (const x of [-1.05, 0, 1.05]) b.box([x, 1.12, -0.25], [0.045, 0.79, 0.05], '#737f9e');

  // The apron stays below the existing ship docking height and clear of its nose.
  b.hull([0, -0.765, 3.25], [4.4, 0.12, 5.6], '#343b58', {}, 0.98);
  for (const side of [-1, 1]) {
    b.box([side * 1.98, -0.68, 3.25], [0.045, 0.018, 4.65], violet, { unshaded: true });
    b.box([side * 1.66, -0.68, 4.95], [0.5, 0.02, 0.12], pale, { unshaded: true });
  }
  b.add(new THREE.RingGeometry(1.12, 1.2, 8), '#c6acff', { position: [0, -0.68, 3.75], rotation: [-Math.PI / 2, 0, 0] }, { unshaded: true });
  b.groundPatch([0, -0.676, 3.75], 0.14, 0.75, pale, { unshaded: true });

  for (const side of [-1, 1]) {
    b.hull([side * 4.75, -0.08, -1.0], [2.4, 1.55, 3.1], '#5a617f');
    b.box([side * 4.75, 0.25, 0.57], [1.55, 0.51, 0.025], '#9e9fdc', { unshaded: true });
    b.box([side * 4.75, 0.78, -0.95], [1.8, 0.05, 2.2], dark);
    b.beam([side * 2.2, -0.35, -1.7], [side * 4.1, -0.35, -1.7], 0.45, '#515877');
    b.beam([side * 4.5, -0.43, -3.0], [side * 8.1, -0.43, -3.0], 0.18, metal);
    b.box([side * 8.0, -0.17, -3.0], [3.6, 0.13, 3.45], '#697194');
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        b.groundPatch([side * 8 + (column - 1) * 1.1, -0.095, -3 + (row - 1) * 1.07], 1.02, 0.98,
          (row + column) % 2 ? '#354575' : '#4c5097', { unshaded: true });
      }
    }
    b.box([side * 9.74, -0.09, -3], [0.04, 0.015, 3.17], violet, { unshaded: true });
    b.hull([side * 2.8, -0.52, 1.7], [0.55, 0.5, 1.2], metal);
    b.box([side * 2.8, -0.255, 1.7], [0.36, 0.03, 0.75], pale, { unshaded: true });
  }

  // An offset communications blade gives each station a readable skyline.
  b.hull([1.15, 2.37, -3.0], [1.15, 0.5, 1.45], dark);
  b.crystal([1.15, 2.6, -3.0], [0.95, 2.85, 1.0], '#a9a8c5', 0.12);
  b.beam([1.15, 2.73, -2.57], [1.29, 5.19, -2.71], 0.055, violet, { unshaded: true });
  b.box([-0.75, 2.4, -2.9], [1.45, 0.31, 1.4], dark);
  for (let i = 0; i < 4; i++) b.box([-0.75, 2.58, -3.4 + i * 0.32], [1.25, 0.08, 0.11], '#8c8ea8');

  for (let i = 0; i < 8; i++) {
    const angle = (i + 0.5) / 8 * Math.PI * 2;
    const x = Math.sin(angle) * 7.53;
    const z = Math.cos(angle) * 6.18;
    b.box([x, -1.35, z], [0.4, 1.3, 0.4], '#41415b');
    b.box([x, -0.65, z], [0.28, 0.05, 0.28], violet, { unshaded: true });
  }
}

export function createVioletEnvironment(stations: THREE.Vector3[], route: THREE.CatmullRomCurve3) {
  const b = new EnvironmentBuilder();
  stations.forEach((position, index) => b.within(position.toArray() as Point3, 0, () => orbitalStation(b, index)));
  b.route(route, '#7261ae', 28, -0.9);

  b.rock([107, 36, -193], [32, 32, 32], '#3f426c', 0.1, 1);
  b.add(new THREE.RingGeometry(41, 44, 40), '#777394', { position: [107, 36, -193], rotation: [1.13, 0.15, 0.24] });
  b.add(new THREE.RingGeometry(47, 47.65, 40), '#51476f', { position: [107, 36, -193], rotation: [1.13, 0.15, 0.24] });
  const asteroids: [Point3, Point3][] = [
    [[-55, -9, -40], [6.5, 5, 7]], [[43, -17, -39], [8, 5, 6]],
    [[-42, 18, -112], [5, 6.5, 5]], [[36, 12, -135], [7, 4, 5]],
    [[-26, -15, 9], [4, 3.4, 4.5]],
  ];
  asteroids.forEach(([position, scale], i) => b.rock(position, scale, '#352d4e', i * 1.7));
  return b.finish('violet');
}
