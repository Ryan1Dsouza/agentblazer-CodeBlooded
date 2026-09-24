import * as THREE from 'three';
import { EnvironmentBuilder, type Point3 } from '../../shared/BakedEnvironmentGeometry';

function depot(b: EnvironmentBuilder) {
  const steel = '#606c78';
  const dark = '#252936';
  const orange = '#ff6528';
  const warm = '#ffc777';

  // The train passes through the open side of the platform. Buildings sit left.
  b.hull([-3.3, -0.42, 0], [13.4, 0.66, 8.6], '#3e414c', { paint: 'deck' }, 0.96);
  b.hull([-5.6, 0.12, -0.55], [5.7, 0.42, 5.2], '#1c202d');
  b.hull([-5.6, 1.91, -0.8], [5.25, 3.2, 4.55], steel, { paint: 'panel' }, 0.92);
  b.hull([-5.6, 3.62, -0.8], [5.45, 0.3, 4.72], '#9c8e85', { paint: 'panel' });
  b.hull([-7.65, 2.4, -1.5], [1.65, 4.8, 2.35], '#3e485a', { paint: 'panel' });
  b.box([-7.65, 4.86, -1.5], [1.4, 0.08, 2.0], orange, { unshaded: true });

  b.add(new THREE.PlaneGeometry(4.0, 0.8), '#d58248', { position: [-5.35, 2.58, 1.5] }, { paint: 'glass', unshaded: true });
  b.box([-5.35, 2.09, 1.56], [4.05, 0.07, 0.065], orange, { unshaded: true });
  for (const x of [-6.7, -5.35, -4.0]) b.box([x, 2.58, 1.52], [0.055, 0.8, 0.04], dark);
  b.add(new THREE.PlaneGeometry(1.55, 1.8), '#363d49', { position: [-5.35, 1.03, 1.51] }, { paint: 'panel' });
  b.box([-5.35, 1.98, 1.59], [1.72, 0.065, 0.08], warm, { unshaded: true });
  b.add(new THREE.PlaneGeometry(1.8, 0.16), warm, { position: [-5.35, 0.16, 1.54] }, { paint: 'hazard', unshaded: true });
  for (let i = 0; i < 3; i++) b.box([-5.35, -0.01 - i * 0.055, 1.95 + i * 0.37], [2.2, 0.13, 0.45], '#7b7779');
  for (const x of [-6.6, -4.75]) b.groundPatch([x, 3.785, -1.0], 1.45, 2.2, '#a8623d', { paint: 'grille' });
  b.box([-6.9, 4.19, -1.8], [0.13, 0.84, 0.13], '#8d969e');
  b.box([-6.9, 4.65, -1.8], [0.28, 0.12, 0.28], warm, { unshaded: true });

  // A generous gantry clears the unchanged locomotive and its roof exhausts.
  for (const side of [-1, 1]) {
    b.box([side * 2.25, 2.47, -1.0], [0.42, 5.2, 0.52], '#77818c', { paint: 'panel' });
    b.box([side * 2.25, 1.0, -0.727], [0.3, 1.45, 0.03], warm, { paint: 'hazard', unshaded: true });
    b.groundPatch([side * 1.58, -0.064, 0.1], 0.22, 6.9, warm, { paint: 'hazard', unshaded: true });
  }
  b.hull([0, 5.12, -1.0], [5.5, 0.56, 1.1], '#7b808a', { paint: 'panel' });
  b.box([0, 5.0, -0.415], [3.35, 0.13, 0.035], orange, { unshaded: true });
  b.add(new THREE.PlaneGeometry(0.88, 0.27), warm, { position: [0, 5.27, -0.41] }, { paint: 'markings', unshaded: true });

  for (const x of [-8.1, 1.5]) {
    for (const z of [-3, 3]) b.box([x, -3.9, z], [0.68, 7.1, 0.68], '#39414e');
  }
  for (let i = 0; i < 3; i++) {
    b.box([-8.9, 0.26, 1.55 + i * 0.86], [0.8, 0.7, 0.72], i % 2 ? '#895341' : '#69717d', { paint: 'panel' });
  }
  for (const z of [-2.8, 0, 2.8]) b.box([-9.43, 0.5, z], [0.12, 1.1, 0.12], steel);
  b.box([-9.43, 1.05, 0], [0.11, 0.12, 6.0], '#aaa098');
}

function magmaRibbon(b: EnvironmentBuilder, path: [number, number][], width: number, y: number, color: string) {
  const edges = path.map(([x, z], i) => {
    const before = path[Math.max(0, i - 1)];
    const after = path[Math.min(path.length - 1, i + 1)];
    const dx = after[0] - before[0], dz = after[1] - before[1];
    const length = Math.hypot(dx, dz);
    return [[x - dz / length * width, y, z + dx / length * width],
      [x + dz / length * width, y, z - dx / length * width]] as [Point3, Point3];
  });
  for (let i = 0; i < edges.length - 1; i++) b.quad(edges[i][0], edges[i + 1][0], edges[i + 1][1], edges[i][1], color, { unshaded: true });
}

function bridge(b: EnvironmentBuilder, spline: THREE.CatmullRomCurve3) {
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const start = spline.getPointAt(i / steps);
    const end = spline.getPointAt((i + 1) / steps);
    const middle = start.clone().add(end).multiplyScalar(0.5);
    const tangent = end.clone().sub(start);
    const yaw = Math.atan2(tangent.x, tangent.z);
    const pitch = -Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z));
    b.box([middle.x, middle.y - 0.19, middle.z], [1.95, 0.35, tangent.length() + 0.06], '#55525b', { paint: 'deck' }, [pitch, yaw, 0]);
    const sideways = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    for (const side of [-1, 1]) {
      const corners = [
        start.clone().addScaledVector(sideways, side * 0.83 - 0.05),
        end.clone().addScaledVector(sideways, side * 0.83 - 0.05),
        end.clone().addScaledVector(sideways, side * 0.83 + 0.05),
        start.clone().addScaledVector(sideways, side * 0.83 + 0.05),
      ].map((p) => [p.x, p.y + 0.005, p.z] as Point3);
      b.quad(corners[0], corners[1], corners[2], corners[3], '#fca65e', { unshaded: true });
    }
  }
  for (let i = 0; i < 18; i++) {
    const position = spline.getPointAt(i / 18);
    const tangent = spline.getTangentAt(i / 18);
    b.within(position.toArray() as Point3, Math.atan2(tangent.x, tangent.z), () => {
      const height = position.y + 8.9;
      b.box([0, -0.43, 0], [3.2, 0.29, 0.56], '#655f65');
      b.box([0, -height / 2 - 0.45, 0], [0.85, height, 1.1], '#3d4350', { paint: 'panel' });
      for (const side of [-1, 1]) b.beam([side * 1.34, -0.6, 0], [0, -3.0, 0], 0.15, '#a56b4d');
    });
  }
}

export function createInfernoEnvironment(stations: THREE.Vector3[], spline: THREE.CatmullRomCurve3) {
  const b = new EnvironmentBuilder();
  const ground = new THREE.PlaneGeometry(430, 430, 14, 14);
  ground.rotateX(-Math.PI / 2);
  const points = ground.getAttribute('position');
  for (let i = 0; i < points.count; i++) points.setY(i, Math.sin(points.getX(i) * 0.037) * Math.cos(points.getZ(i) * 0.043) * 0.14);
  ground.computeVertexNormals();
  b.add(ground, '#34303d', { position: [0, -9.5, -45] });

  const channels: [number, number][][] = [
    [[-205, 120], [-100, 72], [-66, 30], [-17, 1], [-5, -43], [26, -68], [79, -116], [135, -180], [174, -250]],
    [[-205, -149], [-135, -107], [-94, -117], [-54, -92], [-5, -43], [61, -7], [95, 38], [165, 80], [212, 94]],
  ];
  channels.forEach((channel) => {
    magmaRibbon(b, channel, 7.5, -9.26, '#722d32');
    magmaRibbon(b, channel, 5.2, -9.23, '#e94e25');
    magmaRibbon(b, channel, 1.45, -9.2, '#ffb454');
  });

  const shards: [number, number, number, number][] = [
    [-125, -165, 32, 43], [-81, -175, 26, 58], [-24, -188, 38, 47], [40, -182, 30, 63], [105, -157, 41, 48],
    [-106, -55, 24, 35], [103, -49, 28, 39], [-93, 52, 28, 29], [115, 54, 31, 41],
    [-57, 13, 11, 16], [8, 5, 9, 13], [4, -89, 9, 15], [31, -44, 12, 19], [-64, -49, 12, 19],
  ];
  shards.forEach(([x, z, width, height], i) => {
    b.crystal([x, -9.4, z], [width, height, width * 0.83], i % 3 === 0 ? '#4a4357' : '#272b3c', i * 1.37);
    b.crystal([x + width * 0.48, -9.4, z + width * 0.12], [width * 0.48, height * 0.62, width * 0.44], '#424257', i * 1.37 + 0.55);
  });
  bridge(b, spline);
  stations.forEach((position, index) => {
    const tangent = spline.getTangentAt([0.25, 0.5, 0.75][index] ?? 0.25);
    b.within(position.toArray() as Point3, Math.atan2(tangent.x, tangent.z), () => depot(b));
  });
  return b.finish('inferno', true);
}
