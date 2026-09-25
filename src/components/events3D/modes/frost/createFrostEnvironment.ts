import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { EnvironmentBuilder, type Point3 } from '../../shared/BakedEnvironmentGeometry';

const SNOW = ['#ffffff', '#f4f8fa', '#eaf2f6', '#f8fbfc'];
const ICE = ['#b6d8e7', '#cce4ee', '#93bed2'];
const GROUND_Y = -0.1;
export const FROST_CABIN_X = -7.2;

function faceted(source: THREE.BufferGeometry) {
  const geometry = source.index ? source.toNonIndexed() : source;
  if (geometry !== source) source.dispose();
  const input = geometry.getAttribute('position');
  const positions: number[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3();
  for (let i = 0; i < input.count; i += 3) {
    a.fromBufferAttribute(input, i);
    b.fromBufferAttribute(input, i + 1);
    c.fromBufferAttribute(input, i + 2);
    // Three's cone apex includes zero-area faces; leave them out of the landscape.
    if (ab.subVectors(b, a).cross(ac.subVectors(c, a)).lengthSq() > 1e-12) {
      positions.push(...a.toArray(), ...b.toArray(), ...c.toArray());
    }
  }
  geometry.dispose();
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  result.computeVertexNormals();
  return result;
}

function triangle(builder: EnvironmentBuilder, a: Point3, b: Point3, c: Point3, color: string) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
  builder.add(geometry, color);
}

function snowfield(builder: EnvironmentBuilder) {
  // A level driving surface, with broad, irregular triangles painted into the snow.
  const count = 14;
  const points: Point3[][] = Array.from({ length: count + 1 }, (_, row) => (
    Array.from({ length: count + 1 }, (_, col) => [
      -260 + col * 520 / count + (col > 0 && col < count ? Math.sin(row * 7 + col * 3) * 8 : 0),
      GROUND_Y,
      -310 + row * 520 / count + (row > 0 && row < count ? Math.cos(col * 5 + row * 2) * 8 : 0),
    ] as Point3)
  ));

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const a = points[row][col];
      const b = points[row + 1][col];
      const c = points[row + 1][col + 1];
      const d = points[row][col + 1];
      const tone = (row * 7 + col * 11) % SNOW.length;
      triangle(builder, a, b, c, SNOW[tone]);
      triangle(builder, a, c, d, SNOW[(tone + 1) % SNOW.length]);
    }
  }
}

function mountain(builder: EnvironmentBuilder, x: number, z: number, width: number, height: number, seed: number) {
  const peak: Point3 = [x + width * 0.12, height, z - width * 0.08];
  const base: Point3[] = [];
  const snowline: Point3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2 + seed;
    const radius = width * (0.84 + Math.sin(i * 3.7 + seed) * 0.16);
    const point: Point3 = [x + Math.cos(angle) * radius, GROUND_Y, z + Math.sin(angle) * radius * 0.75];
    const t = 0.38 + Math.sin(i * 2.1 + seed) * 0.12;
    base.push(point);
    snowline.push(point.map((value, axis) => value + (peak[axis] - value) * t) as Point3);
  }
  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6;
    builder.quad(base[i], snowline[i], snowline[next], base[next], '#bdcdd7');
    triangle(builder, snowline[i], peak, snowline[next], SNOW[i % SNOW.length]);
  }
}

function pine(builder: EnvironmentBuilder, x: number, z: number, scale: number, seed: number) {
  const height = 6.1 * scale;
  // Opaque geometric shadows keep the same crisp, fixed daylight as the baked faces.
  triangle(builder, [x - 1.25 * scale, -0.075, z], [x + 1.25 * scale, -0.075, z],
    [x + height * 0.59, -0.075, z - height * 0.76], '#d3e0e7');
  builder.within([x, 0, z], seed, () => {
    builder.add(faceted(new THREE.CylinderGeometry(0.16, 0.24, 1.8, 4, 1, true)), '#7b8d98', {
      position: [0, 0.8 * scale, 0], scale: [scale, scale, scale],
    });
    const tiers = [[1.65, 2.8, 2.0], [1.25, 2.5, 3.5], [0.86, 2.3, 4.95]];
    tiers.forEach(([radius, tierHeight, y], index) => {
      builder.add(faceted(new THREE.ConeGeometry(radius, tierHeight, 5)), '#87a4b2', {
        position: [0, y * scale, 0], scale: [scale, scale, scale],
      });
      builder.add(faceted(new THREE.ConeGeometry(radius * 0.96, tierHeight * 0.88, 5, 1, true)), SNOW[index % 2], {
        position: [0, (y + tierHeight * 0.08) * scale, 0], scale: [scale, scale, scale],
      });
    });
  });
}

function lake(builder: EnvironmentBuilder, x: number, z: number, radius: number, seed: number) {
  const edge: Point3[] = Array.from({ length: 9 }, (_, i) => {
    const angle = i / 9 * Math.PI * 2;
    const r = radius * (0.86 + Math.sin(i * 4 + seed) * 0.14);
    return [x + Math.cos(angle) * r, -0.035, z + Math.sin(angle) * r * 1.35];
  });
  edge.forEach((point, i) => {
    const next = edge[(i + 1) % edge.length];
    triangle(builder, [x, -0.035, z], next, point, ICE[i % ICE.length]);
    const outer = (p: Point3): Point3 => [x + (p[0] - x) * 1.08, -0.05, z + (p[2] - z) * 1.08];
    builder.quad(point, next, outer(next), outer(point), '#ffffff');
  });
  builder.quad([x - radius * 0.55, -0.02, z + 2], [x - radius * 0.55, -0.02, z + 2.15],
    [x + 0.12, -0.02, z - 0.85], [x, -0.02, z - 1], '#e9f5fa');
  builder.quad([x, -0.02, z - 1], [x + 0.12, -0.02, z - 0.85],
    [x + radius * 0.48, -0.02, z - radius * 0.6 + 0.14], [x + radius * 0.48, -0.02, z - radius * 0.6], '#e9f5fa');
}

function cabin(builder: EnvironmentBuilder) {
  // The cabin sits beside the route, leaving both the trail and parking position clear.
  builder.hull([-3.2, -0.18, 1.5], [14.4, 0.28, 12], '#e4edf2', {}, 0.96);
  builder.box([FROST_CABIN_X, 1.35, -1.6], [4.8, 2.7, 4.5], '#bdcfda');
  const roof = new ConvexGeometry([
    [-2.75, 0, -2.65], [2.75, 0, -2.65], [0, 2.05, -2.65],
    [-2.75, 0, 2.65], [2.75, 0, 2.65], [0, 2.05, 2.65],
  ].map((p) => new THREE.Vector3(...p as Point3)));
  builder.add(roof, '#ffffff', { position: [FROST_CABIN_X, 2.7, -1.6] });
  builder.box([FROST_CABIN_X, 1.05, 0.68], [1.15, 2.1, 0.1], '#7795a7');
  builder.box([FROST_CABIN_X + 0.4, 1.05, 0.76], [0.08, 0.12, 0.07], '#e6eff4');
  for (const x of [FROST_CABIN_X - 1.7, FROST_CABIN_X + 1.7]) {
    builder.box([x, 1.7, 0.69], [1.05, 0.95, 0.09], '#eff6fa');
    builder.box([x, 1.7, 0.75], [0.86, 0.75, 0.04], '#7e9fb2');
    builder.box([x, 1.7, 0.79], [0.06, 0.76, 0.03], '#eff6fa');
  }
  builder.box([FROST_CABIN_X, 0.12, 1.22], [1.7, 0.24, 0.9], '#d4e1e8');
  builder.box([FROST_CABIN_X - 1.4, 4.1, -2.6], [0.5, 1.0, 0.55], '#97aebb');
  builder.box([FROST_CABIN_X - 1.4, 4.65, -2.6], [0.68, 0.12, 0.73], '#ffffff');
  builder.box([FROST_CABIN_X + 3.3, 0.48, -2.5], [1.0, 0.96, 1.15], '#9db5c4');
  builder.box([FROST_CABIN_X + 3.3, 1.0, -2.5], [1.08, 0.12, 1.23], '#ffffff');

  builder.groundPatch([0, -0.015, 5.5], 5.8, 5, '#c8dbe5');
  for (const side of [-1, 1]) {
    builder.groundPatch([side * 2.6, -0.005, 5.5], 0.12, 4.4, '#f8fcff');
    builder.box([side * 3.25, 0.65, 7.8], [0.12, 1.4, 0.12], '#8ba3b3');
    builder.box([side * 3.25, 1.2, 7.8], [0.2, 0.35, 0.2], '#bad7e5');
  }
  builder.groundPatch([0, -0.005, 3.35], 5.3, 0.12, '#f8fcff');
  builder.box([-1.9, 1.9, 0.4], [0.09, 3.8, 0.09], '#8ba3b3');
  builder.box([-1.4, 3.45, 0.4], [0.95, 0.55, 0.06], '#92b9cd');
}

function snowTrail(builder: EnvironmentBuilder, route: THREE.CatmullRomCurve3) {
  const steps = 52;
  const samples = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const point = route.getPointAt(t);
    const tangent = route.getTangentAt(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    return { point, side };
  });
  for (let i = 0; i < steps; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    const edge = (sample: typeof a, offset: number, y: number): Point3 => [
      sample.point.x + sample.side.x * offset, y, sample.point.z + sample.side.z * offset,
    ];
    builder.quad(edge(a, -2.8, -0.055), edge(a, 2.8, -0.055), edge(b, 2.8, -0.055), edge(b, -2.8, -0.055), '#dce8ef');
    for (const offset of [-0.85, 0.85]) {
      builder.quad(edge(a, offset - 0.065, -0.045), edge(a, offset + 0.065, -0.045),
        edge(b, offset + 0.065, -0.045), edge(b, offset - 0.065, -0.045), '#bbcfdc');
    }
  }
  for (let i = 1; i < 10; i++) {
    const point = route.getPointAt(i / 10);
    const tangent = route.getTangentAt(i / 10);
    const side = i % 2 ? 1 : -1;
    const x = point.x - tangent.z * side * 3.5;
    const z = point.z + tangent.x * side * 3.5;
    builder.box([x, 0.5, z], [0.12, 1.1, 0.12], '#94abba');
    builder.box([x, 0.98, z], [0.2, 0.22, 0.2], '#bfdce9');
  }
}

export function createFrostEnvironment(stations: THREE.Vector3[], route: THREE.CatmullRomCurve3) {
  const builder = new EnvironmentBuilder();
  snowfield(builder);

  const mountains = [
    [-188, -185, 57, 48], [-118, -188, 48, 62], [-58, -204, 56, 78],
    [12, -205, 52, 61], [77, -184, 53, 72], [142, -168, 57, 52], [202, -142, 56, 61],
    [-143, -104, 40, 37], [-120, -36, 36, 32], [-122, 51, 49, 42],
    [139, -71, 40, 41], [130, 11, 43, 35], [111, 88, 48, 38],
    [-53, 112, 45, 35], [12, 137, 53, 48],
  ];
  mountains.forEach(([x, z, width, height], i) => mountain(builder, x, z, width, height, i * 1.7));

  lake(builder, 36, -18, 13, 1);
  lake(builder, -57, -68, 16, 3);
  lake(builder, 39, -107, 11, 5);

  const iceClusters = [
    [-32, -14, 7], [25, -5, 5.5], [47, -34, 8], [-41, -58, 6],
    [39, -72, 7.5], [-29, -111, 6.5], [26, -111, 8], [-65, -35, 9],
  ];
  iceClusters.forEach(([x, z, height], i) => {
    builder.crystal([x, GROUND_Y, z], [3.8, height, 3.0], ICE[i % ICE.length], i * 1.4);
    builder.crystal([x + 2.6, GROUND_Y, z + 1.8], [2.3, height * 0.6, 2.4], ICE[(i + 1) % ICE.length], i * 1.4 + 0.6);
    builder.rock([x - 2, 0, z + 1], [2.8, 0.8, 2.2], '#f5fafc', i);
  });

  const trees = [
    [-10, 14, 1.15], [-15, 9, 0.9], [-20, 17, 1.3], [10, 10, 1.4], [16, 4, 1.1], [22, 15, 0.85],
    [-25, -4, 1.1], [-31, -8, 1.45], [-39, -18, 1.2], [14, -15, 1.1], [19, -23, 0.85],
    [-36, -35, 1.25], [-42, -44, 1.5], [-31, -48, 0.85], [33, -40, 1.1], [29, -47, 1.2], [43, -48, 0.9],
    [-19, -53, 1.1], [-26, -58, 1.4], [-35, -68, 1.2], [34, -62, 1.3], [43, -72, 0.9],
    [-33, -78, 1.3], [-37, -87, 1.0], [21, -81, 1.4], [28, -90, 1.1],
    [5, -104, 1.2], [13, -112, 1.0], [-32, -105, 1.3], [-43, -114, 1.0],
    [-17, 33, 1.0], [25, 36, 1.1], [-63, -27, 1.3], [-72, -82, 1.5],
    [64, -24, 1.5], [62, -55, 1.2], [55, -114, 1.1], [-51, -127, 1.3], [34, -139, 1.2],
  ];
  const routePoints = route.getSpacedPoints(120);
  trees.forEach(([x, z, scale], i) => {
    const clearOfRoute = routePoints.every((p) => Math.hypot(p.x - x, p.z - z) > 7);
    const clearOfStation = stations.every((p) => Math.hypot(p.x - x, p.z - z) > 11);
    if (clearOfRoute && clearOfStation) pine(builder, x, z, scale, i * 1.91);
  });

  const snowbanks = [
    [-20, 25, 9, 2], [23, 22, 8, 1.8], [-37, 1, 10, 2.8], [52, -1, 11, 3],
    [-46, -32, 7, 2], [21, -37, 5, 1.2], [-31, -58, 5, 1.5], [47, -57, 10, 2.4],
    [-47, -94, 10, 2.5], [22, -96, 8, 1.8], [-16, -120, 12, 3], [61, -89, 11, 3],
  ];
  snowbanks.forEach(([x, z, width, height], i) => {
    builder.rock([x, -0.2, z], [width, height, width * 0.65], SNOW[i % SNOW.length], i * 1.3);
  });

  snowTrail(builder, route);
  stations.forEach((position) => builder.within(position.toArray() as Point3, 0, () => cabin(builder)));
  return builder.finish('frost');
}
