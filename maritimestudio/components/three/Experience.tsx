'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { experience } from '@/lib/experience';
import { CALM_EVENT, prefersReduced } from '@/lib/motion';
import { dropFrag, dropVert, particleFrag, particleVert, skyFrag, skyVert, waterFrag, waterVert } from './shaders';

// One persistent three.js scene behind the whole site:
//  - an open sea to the horizon (Gerstner waves, sky reflection, moon path)
//  - a liquid-glass drop that morphs, follows the pointer and bursts on page change
//  - glowing plankton that drifts up and parts around the cursor
// Scrolling dives the camera below the surface. The canvas never unmounts,
// so the scene keeps flowing while routes change on top of it.

const SUN = new THREE.Vector3(0.42, 0.11, -1).normalize();
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Layout = { pos: [number, number, number]; scale: number };
function dropLayout(route: string, narrow: boolean): Layout {
  const home = route === '/' || route === '';
  if (narrow) return home ? { pos: [0.6, 3.1, -2], scale: 0.62 } : { pos: [1.4, 3.3, -4], scale: 0.5 };
  if (home) return { pos: [2.55, 1.55, 1.4], scale: 1.08 };
  if (route.startsWith('/glossary')) return { pos: [3.6, 2.2, -2.5], scale: 0.7 };
  if (route.startsWith('/contact')) return { pos: [-3.4, 1.9, -1.5], scale: 0.75 };
  return { pos: [3.3, 1.9, -1.8], scale: 0.82 };
}

function Scene({ route, still }: { route: string; still: boolean }) {
  const { camera, size } = useThree();
  const narrow = size.width < 760;

  const shared = useMemo(() => ({ uSunDir: { value: SUN }, uUnder: { value: 0 }, uTime: { value: 10 } }), []);

  const skyMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: shared, side: THREE.BackSide, depthWrite: false }),
    [shared],
  );
  const waterMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waterVert,
        fragmentShader: waterFrag,
        uniforms: { ...shared, uSplash: { value: 0 }, uPointer: { value: new THREE.Vector2() } },
        side: THREE.DoubleSide,
      }),
    [shared],
  );
  const dropMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dropVert,
        fragmentShader: dropFrag,
        uniforms: { ...shared, uMorph: { value: 0.25 }, uPointer: { value: new THREE.Vector3() } },
        transparent: true,
      }),
    [shared],
  );

  const count = narrow ? 900 : 2200;
  const particles = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = Math.random() * 12 - 8;
      pos[i * 3 + 2] = Math.random() * -26 + 6;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const particleMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVert,
        fragmentShader: particleFrag,
        uniforms: { uTime: shared.uTime, uPixel: { value: Math.min(window.devicePixelRatio, 1.5) }, uPointerWorld: { value: new THREE.Vector3(99, 99, 99) } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [shared],
  );

  const drop = useRef<THREE.Mesh>(null);
  const state = useRef({ px: 0, py: 0, splash: 0, pull: 0, lastPX: 0, lastPY: 0, pos: new THREE.Vector3(...dropLayout(route, narrow).pos), scale: dropLayout(route, narrow).scale });
  const target = dropLayout(route, narrow);
  const ray = useMemo(() => ({ v: new THREE.Vector3(), dir: new THREE.Vector3(), look: new THREE.Vector3() }), []);

  useFrame((_, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    if (!still) shared.uTime.value += dt;

    // pointer (smoothed) and how fast it moves → surface tension pull
    s.px += (experience.pointer.x - s.px) * 0.06;
    s.py += (experience.pointer.y - s.py) * 0.06;
    const speed = Math.hypot(experience.pointer.x - s.lastPX, experience.pointer.y - s.lastPY);
    s.lastPX = experience.pointer.x;
    s.lastPY = experience.pointer.y;
    s.pull += (Math.min(1, 0.35 + speed * 25) - s.pull) * 0.05;
    s.splash += (experience.splash - s.splash) * (experience.splash > s.splash ? 0.12 : 0.03);

    // scroll dives the camera beneath the surface
    const vh = window.innerHeight;
    const dive = smooth(0, vh * 1.5, window.scrollY);
    const camY = THREE.MathUtils.lerp(2.3, -2.4, dive) + s.py * 0.35 - s.splash * 0.4;
    camera.position.set(s.px * 0.9, camY, THREE.MathUtils.lerp(9, 7.5, dive));
    ray.look.set(s.px * 0.3, THREE.MathUtils.lerp(0.7, -0.4, dive) + s.py * 0.2, 0);
    camera.lookAt(ray.look);
    shared.uUnder.value = smooth(0.25, -0.35, camera.position.y);

    // water
    waterMat.uniforms.uSplash.value = s.splash;
    (waterMat.uniforms.uPointer.value as THREE.Vector2).set(s.px, s.py);

    // drop: glide to this page's spot, sink with the dive, breathe and bob
    const t = shared.uTime.value;
    const goal = ray.v.set(target.pos[0] + dive * 1.8, target.pos[1] - dive * 4.6 + Math.sin(t * 0.8) * 0.12, target.pos[2] - dive * 3.5);
    s.pos.lerp(goal, 0.04);
    s.scale += (target.scale * (1 + s.splash * 0.25) - s.scale) * 0.05;
    if (drop.current) {
      drop.current.position.copy(s.pos);
      drop.current.scale.setScalar(s.scale);
      drop.current.rotation.y += dt * 0.12;
      drop.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    dropMat.uniforms.uMorph.value = 0.16 + s.splash * 0.55 + (still ? 0 : 0.04 * Math.sin(t));
    (dropMat.uniforms.uPointer.value as THREE.Vector3).set(s.px * 1.6, s.py * 1.6, 0.9).multiplyScalar(s.pull);

    // pointer projected into the plankton swarm
    ray.dir.set(s.px, s.py, 0.5).unproject(camera).sub(camera.position).normalize();
    const along = (-1 - camera.position.z) / ray.dir.z;
    (particleMat.uniforms.uPointerWorld.value as THREE.Vector3).copy(camera.position).addScaledVector(ray.dir, along);
  });

  return (
    <>
      <mesh material={skyMat} frustumCulled={false}>
        <sphereGeometry args={[100, 32, 16]} />
      </mesh>
      <mesh material={waterMat} rotation-x={-Math.PI / 2} frustumCulled={false}>
        <planeGeometry args={[160, 160, narrow ? 140 : 260, narrow ? 140 : 260]} />
      </mesh>
      <mesh ref={drop} material={dropMat}>
        <icosahedronGeometry args={[1, narrow ? 20 : 36]} />
      </mesh>
      <points geometry={particles} material={particleMat} frustumCulled={false} />
    </>
  );
}

class Guard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Experience({ route }: { route: string }) {
  const [still, setStill] = useState(true);
  const [awake, setAwake] = useState(true);
  const [ready, setReady] = useState(false);
  const [supported] = useState(() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  });
  const invalidateRef = useRef<() => void>(() => {});

  useEffect(() => {
    const sync = () => setStill(prefersReduced());
    sync();
    window.addEventListener(CALM_EVENT, sync);
    const onVis = () => setAwake(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    const onMove = (e: PointerEvent) => {
      experience.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      experience.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      invalidateRef.current();
    };
    const onScroll = () => invalidateRef.current();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener(CALM_EVENT, sync);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!supported) return null;

  return (
    <div className={`experience${ready ? ' is-ready' : ''}`} aria-hidden="true">
      <Guard>
        <Canvas
          frameloop={!awake ? 'never' : still ? 'demand' : 'always'}
          dpr={[1, 1.5]}
          camera={{ fov: 45, near: 0.1, far: 220, position: [0, 2.3, 9] }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl, invalidate }) => {
            gl.setClearColor('#061C2C');
            invalidateRef.current = invalidate;
            experience.ready = true;
            requestAnimationFrame(() => setReady(true));
          }}
        >
          <Scene route={route} still={still} />
        </Canvas>
      </Guard>
    </div>
  );
}
