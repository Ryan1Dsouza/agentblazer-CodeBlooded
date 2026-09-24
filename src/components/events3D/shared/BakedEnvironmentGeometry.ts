import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

export type Point3 = [number, number, number];
export type Paint = 'solid' | 'panel' | 'grille' | 'hazard' | 'glass' | 'deck' | 'energy' | 'markings';

interface Surface {
  paint?: Paint;
  unshaded?: boolean;
  shade?: number;
}

interface Placement {
  position?: Point3;
  rotation?: Point3;
  scale?: Point3;
}

export interface BakedEnvironmentResources {
  geometry: THREE.BufferGeometry;
  material: THREE.MeshBasicMaterial;
  atlas?: THREE.DataTexture;
}

const PAINTS: Paint[] = ['solid', 'panel', 'grille', 'hazard', 'glass', 'deck', 'energy', 'markings'];
const BAKED_SUN = new THREE.Vector3(-0.5, 0.85, 0.65).normalize();

/** One 128 × 64 painted atlas. Colors and directional shading live in vertices. */
function createPaintAtlas() {
  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = Math.floor(x / 32) + Math.floor(y / 32) * 4;
      const u = x % 32;
      const v = y % 32;
      const edge = Math.min(u, v, 31 - u, 31 - v);
      let value = 1;
      if (tile === 1) value = edge < 3 ? 0.48 : u === 8 || v === 23 ? 0.76 : 0.94;
      if (tile === 2) value = edge < 3 ? 0.38 : v % 6 < 2 ? 0.2 : 0.9;
      if (tile === 3) value = (u + v) % 16 < 8 ? 1 : 0.12;
      if (tile === 4) value = 0.27 + v / 55 + (u > 19 && u < 23 ? 0.18 : 0);
      if (tile === 5) value = edge < 2 || u === 16 || v === 16 ? 0.5 : 0.94;
      if (tile === 6) value = edge < 4 ? 0.35 : v % 9 < 3 ? 0.64 : 1;
      if (tile === 7) value = v > 8 && v < 23 && (u % 6 < 2 || v === 10 || v === 21) ? 0.96 : 0.13;
      const offset = (y * width + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = Math.round(value * 255);
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export function facetedHull(width: number, height: number, depth: number, taper = 0.88) {
  const outline = [[-0.36, -0.5], [0.36, -0.5], [0.5, -0.34], [0.5, 0.34], [0.36, 0.5], [-0.36, 0.5], [-0.5, 0.34], [-0.5, -0.34]];
  return new ConvexGeometry(outline.flatMap(([x, z]) => [
    new THREE.Vector3(x * width, -height / 2, z * depth),
    new THREE.Vector3(x * width * taper, height / 2, z * depth * taper),
  ]));
}

/** The temporary primitives are flattened into one material and one draw call. */
export class EnvironmentBuilder {
  private positions: number[] = [];
  private colors: number[] = [];
  private uvs: number[] = [];
  private transform = new THREE.Matrix4();

  within(position: Point3, yaw: number, build: () => void) {
    const previous = this.transform;
    this.transform = previous.clone().multiply(new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw),
      new THREE.Vector3(1, 1, 1),
    ));
    try { build(); } finally { this.transform = previous; }
  }

  add(source: THREE.BufferGeometry, color: string, placement: Placement = {}, surface: Surface = {}) {
    const geometry = source.index ? source.toNonIndexed() : source;
    if (geometry !== source) source.dispose();
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    const size = bounds.getSize(new THREE.Vector3());
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    const existingUVs = geometry.getAttribute('uv');
    const localUVs: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      if (existingUVs) {
        localUVs.push(existingUVs.getX(i), existingUVs.getY(i));
      } else {
        const nx = Math.abs(normals.getX(i));
        const ny = Math.abs(normals.getY(i));
        const nz = Math.abs(normals.getZ(i));
        const u = nx > ny && nx > nz
          ? (positions.getZ(i) - bounds.min.z) / Math.max(size.z, 0.001)
          : (positions.getX(i) - bounds.min.x) / Math.max(size.x, 0.001);
        const v = ny > nx && ny > nz
          ? (positions.getZ(i) - bounds.min.z) / Math.max(size.z, 0.001)
          : (positions.getY(i) - bounds.min.y) / Math.max(size.y, 0.001);
        localUVs.push(u, v);
      }
    }
    const matrix = this.transform.clone().multiply(new THREE.Matrix4().compose(
      new THREE.Vector3(...(placement.position ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(placement.rotation ?? [0, 0, 0]))),
      new THREE.Vector3(...(placement.scale ?? [1, 1, 1])),
    ));
    geometry.applyMatrix4(matrix);
    const base = new THREE.Color(color);
    const normal = new THREE.Vector3();
    const tile = PAINTS.indexOf(surface.paint ?? 'solid');
    for (let i = 0; i < positions.count; i++) {
      normal.fromBufferAttribute(normals, i);
      const light = surface.unshaded ? 1 : 0.46 + Math.max(0, normal.dot(BAKED_SUN)) * 0.46 + Math.max(0, normal.y) * 0.08;
      const shade = light * (surface.shade ?? 1);
      this.positions.push(positions.getX(i), positions.getY(i), positions.getZ(i));
      this.colors.push(base.r * shade, base.g * shade, base.b * shade);
      // Two-pixel gutters keep linear filtering inside each atlas tile.
      this.uvs.push(((tile % 4) * 32 + 2.5 + localUVs[i * 2] * 27) / 128,
        (Math.floor(tile / 4) * 32 + 2.5 + localUVs[i * 2 + 1] * 27) / 64);
    }
    geometry.dispose();
  }

  box(position: Point3, scale: Point3, color: string, surface: Surface = {}, rotation: Point3 = [0, 0, 0]) {
    this.add(new THREE.BoxGeometry(1, 1, 1), color, { position, scale, rotation }, surface);
  }

  hull(position: Point3, size: Point3, color: string, surface: Surface = {}, taper = 0.88, yaw = 0) {
    this.add(facetedHull(...size, taper), color, { position, rotation: [0, yaw, 0] }, surface);
  }

  beam(from: Point3, to: Point3, width: number, color: string, surface: Surface = {}, depth = width) {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const direction = end.clone().sub(start);
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()));
    this.box(start.add(end).multiplyScalar(0.5).toArray() as Point3, [width, direction.length(), depth], color, surface, [rotation.x, rotation.y, rotation.z]);
  }

  quad(a: Point3, b: Point3, c: Point3, d: Point3, color: string, surface: Surface = {}) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    this.add(geometry, color, {}, surface);
  }

  groundPatch(position: Point3, width: number, depth: number, color: string, surface: Surface = {}, yaw = 0) {
    this.add(new THREE.PlaneGeometry(width, depth), color, { position, rotation: [-Math.PI / 2, 0, yaw] }, surface);
  }

  rock(position: Point3, scale: Point3, color: string, seed: number, detail: 0 | 1 = 0) {
    const geometry = new THREE.IcosahedronGeometry(1, detail);
    const points = geometry.getAttribute('position');
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
      // Coordinate-based noise keeps duplicated vertices welded visually.
      const variation = 1 + Math.sin(x * 7.3 + y * 9.1 + z * 5.7 + seed) * 0.16;
      points.setXYZ(i, x * variation, y * variation, z * variation);
    }
    geometry.computeVertexNormals();
    this.add(geometry, color, { position, scale, rotation: [0.12, seed, -0.1] });
  }

  crystal(position: Point3, scale: Point3, color: string, yaw = 0) {
    const geometry = new ConvexGeometry([
      new THREE.Vector3(-0.45, 0, -0.3), new THREE.Vector3(0.4, 0, -0.3),
      new THREE.Vector3(0.45, 0, 0.32), new THREE.Vector3(-0.35, 0, 0.4),
      new THREE.Vector3(-0.32, 0.77, -0.24), new THREE.Vector3(0.35, 0.83, -0.2),
      new THREE.Vector3(0.34, 0.7, 0.29), new THREE.Vector3(-0.27, 0.72, 0.32),
      new THREE.Vector3(0.12, 1.0, -0.02),
    ]);
    this.add(geometry, color, { position, scale, rotation: [0, yaw, 0] });
  }

  route(curve: THREE.CatmullRomCurve3, color: string, count: number, verticalOffset: number, ground = false) {
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const position = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      this.within([position.x, (ground ? 0 : position.y) + verticalOffset, position.z], Math.atan2(tangent.x, tangent.z), () => {
        this.quad([-0.58, 0, -0.38], [-0.45, 0, -0.48], [0, 0, 0.13], [0, 0, 0.38], color, { unshaded: true });
        this.quad([0, 0, 0.38], [0, 0, 0.13], [0.45, 0, -0.48], [0.58, 0, -0.38], color, { unshaded: true });
      });
    }
  }

  finish(theme: string, atlas = false): BakedEnvironmentResources {
    const triangles = this.positions.length / 9;
    if (triangles >= 5000) throw new Error(`${theme} environment exceeds its 5k triangle budget: ${triangles}`);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    if (atlas) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    // Basic material only needs positions/colors/UVs. Drop normals and groups.
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.userData = { theme, triangles, staticEnvironment: true };
    const texture = atlas ? createPaintAtlas() : undefined;
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, map: texture ?? null, toneMapped: false });
    material.name = `${theme}-baked-color`;
    return { geometry, material, atlas: texture };
  }
}
