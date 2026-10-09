'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CALM_EVENT, clamp, prefersReduced } from '@/lib/motion';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0); // full-screen quad, camera ignored
}`;

// Domain-warped noise in the night-sea palette, rippling under the pointer,
// with rare warm "sand" glints where the swell peaks.
const fragmentShader = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform float uRipple;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}

void main(){
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 m = vec2(uMouse.x * asp, uMouse.y);
  float md = distance(p, m);
  float t = uTime * .035;
  vec2 q = vec2(fbm(p*1.5 + vec2(0., t)), fbm(p*1.5 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p*1.5 + 3.4*q + vec2(1.7, 9.2) + t*1.3), fbm(p*1.5 + 3.4*q + vec2(8.3, 2.8) - t*1.1));
  r += uRipple * .16 * exp(-md * 3.5) * vec2(sin(uTime * 1.4 - md * 16.));
  float f = fbm(p*1.5 + 4.*r);
  vec3 abyss = vec3(.024,.110,.173);
  vec3 ink = vec3(.039,.255,.455);
  vec3 lagoon = vec3(.306,.557,.635);
  vec3 sky = vec3(.482,.741,.910);
  vec3 sand = vec3(.851,.706,.541);
  vec3 col = mix(abyss, ink, clamp(f*f*2.1, 0., 1.));
  col = mix(col, lagoon, clamp(length(q)*.6 - .2, 0., 1.) * .5);
  col = mix(col, sky, clamp(pow(r.x, 3.) * 1.5, 0., 1.) * .42);
  col += sand * pow(clamp((f - .6) * 2.7, 0., 1.), 3.) * .55;
  col += sky * .09 * exp(-md * 5.) * uRipple;
  col *= .62 + .48 * uv.y;
  col = mix(abyss, col, uIntensity);
  gl_FragColor = vec4(col, 1.);
}`;

type Pointer = { tx: number; ty: number; active: boolean };

function Sea({ intensity, pointer, still }: { intensity: number; pointer: React.RefObject<Pointer>; still: boolean }) {
  const { size, invalidate } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const t0 = useMemo(() => 20 + Math.random() * 20, []);
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: t0 },
      uMouse: { value: new THREE.Vector2(0.7, 0.6) },
      uIntensity: { value: intensity },
      uRipple: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uRes.value.set(size.width, size.height);
    uniforms.uIntensity.value = intensity;
    invalidate();
  }, [size, intensity, uniforms, invalidate]);

  useFrame((_, delta) => {
    if (still) return;
    const u = uniforms;
    u.uTime.value += Math.min(delta, 0.05);
    const p = pointer.current!;
    u.uMouse.value.x += (p.tx - u.uMouse.value.x) * 0.04;
    u.uMouse.value.y += (p.ty - u.uMouse.value.y) * 0.04;
    u.uRipple.value += ((p.active ? 1 : 0) - u.uRipple.value) * 0.05;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function OceanScene({ intensity }: { intensity: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pointer = useRef<Pointer>({ tx: 0.7, ty: 0.6, active: false });
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setStill(prefersReduced());
    sync();
    window.addEventListener(CALM_EVENT, sync);
    return () => window.removeEventListener(CALM_EVENT, sync);
  }, []);

  // Pause when the hero scrolls away or the tab is hidden.
  useEffect(() => {
    const host = wrap.current?.parentElement;
    if (!host) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(host);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // The whole hero (not just the canvas) stirs the water.
  useEffect(() => {
    const hero = wrap.current?.parentElement?.parentElement;
    const host = wrap.current?.parentElement;
    if (!hero || !host) return;
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.current.tx = clamp((e.clientX - r.left) / r.width, 0, 1);
      pointer.current.ty = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
      pointer.current.active = true;
    };
    const leave = () => (pointer.current.active = false);
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', leave);
    return () => {
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
    };
  }, []);

  const small = typeof window !== 'undefined' && window.innerWidth < 700;

  return (
    <div ref={wrap} className={`ocean-canvas${ready ? ' is-ready' : ''}`}>
      <Canvas
        frameloop={still ? 'demand' : visible ? 'always' : 'never'}
        dpr={small ? [0.4, 0.6] : [0.5, 0.8]}
        gl={{ antialias: false, alpha: false, powerPreference: 'low-power', depth: false, stencil: false }}
        orthographic
        onCreated={() => requestAnimationFrame(() => setReady(true))}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Sea intensity={intensity} pointer={pointer} still={still} />
      </Canvas>
    </div>
  );
}
