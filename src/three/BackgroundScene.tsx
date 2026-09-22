import { Canvas } from '@react-three/fiber';
import ParticleField from './ParticleField';
import NetworkNodes from './NetworkNodes';
import FloatingGeometry from './FloatingGeometry';

export default function BackgroundScene() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      opacity: 0.6
    }}>
      <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
        <ParticleField />
        <NetworkNodes />
        <FloatingGeometry />
      </Canvas>
    </div>
  );
}
