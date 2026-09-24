import { useEffect } from 'react';
import type { BakedEnvironmentResources } from './BakedEnvironmentGeometry';

export default function StaticEnvironment({ resources, theme, background }: {
  resources: BakedEnvironmentResources;
  theme: string;
  background: string;
}) {
  useEffect(() => () => {
    resources.geometry.dispose();
    resources.material.dispose();
    resources.atlas?.dispose();
  }, [resources]);

  return <>
    <color attach="background" args={[background]} />
    <mesh
      name={`${theme}-environment`}
      geometry={resources.geometry}
      material={resources.material}
      matrixAutoUpdate={false}
      dispose={null}
      userData={{ staticEnvironment: true }}
    />
  </>;
}
