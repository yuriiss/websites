'use client';

import dynamic from 'next/dynamic';

// The WebGL sea is a React Three Fiber scene, loaded only in the browser so
// three.js never blocks the first paint. Until it arrives (or without WebGL)
// the CSS gradient on .ocean is what you see.
const OceanScene = dynamic(() => import('./OceanScene'), { ssr: false });

type Props = { intensity?: number; soft?: boolean };

export function Ocean({ intensity, soft = false }: Props) {
  const level = intensity ?? (soft ? 0.85 : 1);
  return (
    <div className={soft ? 'ocean ocean--soft' : 'ocean'} aria-hidden="true">
      <OceanScene intensity={level} />
    </div>
  );
}
