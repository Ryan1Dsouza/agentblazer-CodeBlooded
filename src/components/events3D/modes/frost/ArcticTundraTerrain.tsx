import { useMemo } from 'react';
import * as THREE from 'three';
import StaticEnvironment from '../../shared/StaticEnvironment';
import { createFrostEnvironment } from './createFrostEnvironment';

interface TerrainProps {
  stations: THREE.Vector3[];
  route: THREE.CatmullRomCurve3;
}

export default function ArcticTundraTerrain({ stations, route }: TerrainProps) {
  const resources = useMemo(() => createFrostEnvironment(stations, route), [stations, route]);

  return (
    <>
      <StaticEnvironment resources={resources} theme="frost" background="#dcebf3" />
      {/* Match the landscape's fixed daylight on the moving rover. */}
      <ambientLight intensity={0.9} color="#f4f8fc" />
      <directionalLight position={[-50, 85, 65]} intensity={2.0} color="#ffffff" />
    </>
  );
}