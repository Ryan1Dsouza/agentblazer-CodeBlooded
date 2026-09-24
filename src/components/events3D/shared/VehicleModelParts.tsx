import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';

export type Vector3Tuple = [number, number, number];

export interface PartTransform {
  position: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
}

type VehicleResource = THREE.BufferGeometry | THREE.Material | THREE.Texture;

/** Own shared resources once per vehicle, including a baked, vehicle-only reflection map. */
export function useVehicleResources<T extends Record<string, VehicleResource>>(factory: () => T): T {
  const resources = useMemo(factory, [factory]);
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    // No HDR download or per-frame environment capture. Do this after commit so
    // an abandoned React render cannot leak a GPU render target.
    const room = new RoomEnvironment(gl);
    const generator = new THREE.PMREMGenerator(gl);
    const reflection = generator.fromScene(room, 0.04);
    room.dispose();
    generator.dispose();

    const materials = Object.values(resources).filter(
      (resource): resource is THREE.MeshStandardMaterial => resource instanceof THREE.MeshStandardMaterial,
    );
    materials.forEach((material) => {
      material.envMap = reflection.texture;
      material.needsUpdate = true;
    });

    return () => {
      materials.forEach((material) => {
        material.envMap = null;
        material.needsUpdate = true;
      });
      reflection.dispose();
    };
  }, [gl, resources]);

  useEffect(() => () => {
    // The owning vehicle uses dispose={null}; instances must not dispose a
    // geometry/material still in use by another part of the same model.
    Object.values(resources).forEach((resource) => resource.dispose());
  }, [resources]);

  return resources;
}

/** A single draw call for each family of static hardware. */
export const InstancedParts = memo(function InstancedParts({ geometry, material, transforms, name }: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  transforms: PartTransform[];
  name?: string;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const instance = mesh.current;
    if (!instance) return;
    const dummy = new THREE.Object3D();
    transforms.forEach(({ position, rotation, scale }, index) => {
      dummy.position.set(...position);
      dummy.rotation.set(...(rotation ?? [0, 0, 0]));
      dummy.scale.set(...(scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      instance.setMatrixAt(index, dummy.matrix);
    });
    instance.instanceMatrix.needsUpdate = true;
    instance.computeBoundingBox();
    instance.computeBoundingSphere();
    // dispose={null} preserves the shared mesh assets, but the per-instance
    // matrix buffer still needs releasing when this batch unmounts.
    return () => instance.dispose();
  }, [transforms, geometry, material]);

  return <instancedMesh ref={mesh} name={name} args={[geometry, material, transforms.length]} />;
});

/** Faceted hard-surface geometry with planar UVs for the brushed finish. */
export function createFacetedGeometry(points: Vector3Tuple[]) {
  const geometry = new ConvexGeometry(points.map((point) => new THREE.Vector3(...point)));
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const uv = new Float32Array(positions.count * 2);
  for (let i = 0; i < positions.count; i++) {
    const nx = Math.abs(normals.getX(i));
    const ny = Math.abs(normals.getY(i));
    const nz = Math.abs(normals.getZ(i));
    uv[i * 2] = nx > ny && nx > nz ? positions.getZ(i) : positions.getX(i);
    uv[i * 2 + 1] = ny > nx && ny > nz ? positions.getZ(i) : positions.getY(i);
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/** Cross-sections are [z, full width, bottom, top]. Eight corners bevel the hull. */
export function createHull(sections: [number, number, number, number][]) {
  return createFacetedGeometry(sections.flatMap(([z, width, bottom, top]) => {
    const half = width / 2;
    const bevel = (top - bottom) * 0.18;
    return [
      [-half * 0.76, bottom, z], [half * 0.76, bottom, z],
      [half, bottom + bevel, z], [half, top - bevel, z],
      [half * 0.76, top, z], [-half * 0.76, top, z],
      [-half, top - bevel, z], [-half, bottom + bevel, z],
    ] as Vector3Tuple[];
  }));
}

export function createPanel(outline: Vector3Tuple[], thickness: number, axis: 0 | 1 | 2 = 1) {
  return createFacetedGeometry(outline.flatMap((point) => [-1, 1].map((side) => {
    const vertex: Vector3Tuple = [...point];
    vertex[axis] += side * thickness / 2;
    return vertex;
  })));
}

/** Transform a unit Y-axis box/cylinder into a seam, strut, or light strip. */
export function beam(from: Vector3Tuple, to: Vector3Tuple, width: number, depth = width): PartTransform {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const rotation = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()),
  );
  return {
    position: start.add(end).multiplyScalar(0.5).toArray() as Vector3Tuple,
    rotation: [rotation.x, rotation.y, rotation.z],
    scale: [width, direction.length(), depth],
  };
}

/** 16 KB packed texture: green = brushed roughness, blue = metallic variation. */
export function createMetalFinish() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const grain = (x * 13 + y * 47) % 19;
      data[offset] = 255;
      data[offset + 1] = 218 + (y * 17 % 9) + Math.round(grain * 0.35);
      data[offset + 2] = 242 + Math.round(grain * 0.5);
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function createGlowTexture() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const radius = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
      const offset = (y * size + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = 255;
      data[offset + 3] = Math.round(Math.pow(Math.max(0, 1 - radius), 2.5) * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
