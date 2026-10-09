'use client';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useState } from 'react';
import { CALM_EVENT, prefersReduced } from '@/lib/motion';
import { setLenis } from '@/lib/scroll';

gsap.registerPlugin(ScrollTrigger);

// Lenis inertia scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync.
// Off for prefers-reduced-motion and Calm mode: native scrolling is used instead.
export function SmoothScroll() {
  const [calmTick, setCalmTick] = useState(0);

  useEffect(() => {
    const onCalm = () => setCalmTick((n) => n + 1);
    window.addEventListener(CALM_EVENT, onCalm);
    return () => window.removeEventListener(CALM_EVENT, onCalm);
  }, []);

  useEffect(() => {
    if (prefersReduced()) {
      setLenis(null);
      return;
    }
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      anchors: { offset: -100 },
    });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, [calmTick]);

  return null;
}
