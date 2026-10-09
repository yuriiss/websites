'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CALM_EVENT, finePointer, prefersReduced } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

// Page motion with GSAP + ScrollTrigger, re-applied to each route:
//  - [data-reveal]: rise + un-blur as it enters (batched, staggered)
//  - .split-line: headline lines slide up out of a mask
//  - [data-count]: numbers count up; .gauge arcs fill; .stat rules draw
//  - [data-parallax]: gentle scroll-linked drift
//  - .instrument: tilts with the pointer
// Pointer light on .glass and magnetic .btn are delegated once.
// With prefers-reduced-motion / Calm mode everything is shown at rest.

function mountPage(main: HTMLElement): () => void {
  const ctx = gsap.context(() => {
    const reveal = gsap.utils.toArray<HTMLElement>('[data-reveal]', main);
    const lines = gsap.utils.toArray<HTMLElement>('.split-line > span', main);
    const counters = gsap.utils.toArray<HTMLElement>('[data-count]', main);
    const gauges = gsap.utils.toArray<HTMLElement>('.gauge', main);
    const stats = gsap.utils.toArray<HTMLElement>('.stat', main);

    if (prefersReduced()) {
      gsap.set(reveal, { autoAlpha: 1, y: 0, filter: 'none' });
      gsap.set(lines, { y: 0, yPercent: 0 });
      stats.forEach((s) => s.classList.add('is-in'));
      gauges.forEach((g) => fillGauge(g, true));
      return;
    }

    // Headline lines: one orchestrated entrance per page.
    gsap.fromTo(lines, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12, delay: 0.12 });

    // Elements with an explicit --d (hero copy) play on load in that order.
    const timed = reveal.filter((el) => el.style.getPropertyValue('--d') && !el.closest('[data-stagger]'));
    timed.forEach((el) => {
      gsap.to(el, {
        autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out',
        delay: parseFloat(el.style.getPropertyValue('--d')) || 0,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    // Everything else rises in batches as it scrolls into view.
    const rest = reveal.filter((el) => !timed.includes(el));
    ScrollTrigger.batch(rest, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
    });

    counters.forEach((el) => {
      const target = parseFloat(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';
      const state = { v: 0 };
      el.textContent = `0${suffix}`;
      gsap.to(state, {
        v: target, duration: 2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => {
          el.textContent = Math.round(state.v) + suffix;
        },
      });
    });

    gauges.forEach((g) => {
      fillGauge(g, false);
      ScrollTrigger.create({ trigger: g, start: 'top 90%', once: true, onEnter: () => fillGauge(g, true) });
    });
    stats.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 90%', once: true, onEnter: () => s.classList.add('is-in') }));

    // Scroll-linked drift: hero copy and panel separate slightly, the sea sinks.
    gsap.utils.toArray<HTMLElement>('[data-parallax]', main).forEach((el) => {
      const speed = parseFloat(el.dataset.parallax || '0.15');
      gsap.to(el, {
        yPercent: -speed * 100, ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top top', end: 'bottom top', scrub: true },
      });
    });
    gsap.utils.toArray<HTMLElement>('.hero .ocean, .page-hero .ocean', main).forEach((sea) => {
      gsap.to(sea, {
        yPercent: 18, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: sea.parentElement, start: 'top top', end: 'bottom top', scrub: true },
      });
    });
  }, main);

  // Instrument panel tilts with the pointer (quickTo keeps it fluid).
  const panel = main.querySelector<HTMLElement>('.instrument');
  const hero = panel?.closest<HTMLElement>('.hero');
  let offTilt = () => {};
  if (panel && hero && finePointer() && !prefersReduced()) {
    gsap.set(panel, { transformPerspective: 1200 });
    const rx = gsap.quickTo(panel, 'rotationX', { duration: 1.2, ease: 'power3.out' });
    const ry = gsap.quickTo(panel, 'rotationY', { duration: 1.2, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', leave);
    offTilt = () => {
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
    };
  }

  // Deep link to a glossary term: glow it.
  if (location.hash) {
    try {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.classList.add('is-target');
    } catch {
      /* malformed hash */
    }
  }

  // Layout settles after fonts load.
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);

  return () => {
    offTilt();
    ctx.revert();
  };
}

function fillGauge(g: HTMLElement, full: boolean) {
  const fill = g.querySelector<SVGPathElement>('.gauge-fill');
  if (!fill?.getTotalLength) return;
  const len = fill.getTotalLength();
  const val = parseFloat(g.dataset.value || '0') / 100;
  if (!full) {
    gsap.set(fill, { strokeDasharray: len, strokeDashoffset: len });
    return;
  }
  gsap.fromTo(
    fill,
    { strokeDasharray: len, strokeDashoffset: prefersReduced() ? len * (1 - val) : len },
    { strokeDashoffset: len * (1 - val), duration: prefersReduced() ? 0 : 2.4, ease: 'expo.out' },
  );
}

export function Effects() {
  const pathname = usePathname();
  const [calmTick, setCalmTick] = useState(0);

  useEffect(() => {
    const onCalm = () => setCalmTick((n) => n + 1);
    window.addEventListener(CALM_EVENT, onCalm);
    return () => window.removeEventListener(CALM_EVENT, onCalm);
  }, []);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main');
    if (!main) return;
    return mountPage(main);
  }, [pathname, calmTick]);

  // Pointer light on glass cards and magnetic buttons.
  useEffect(() => {
    if (!finePointer()) return;
    let magnet: HTMLElement | null = null;
    const release = () => {
      if (!magnet) return;
      gsap.to(magnet, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      magnet = null;
    };
    const onMove = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const card = t.closest?.<HTMLElement>('.glass');
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      const btn = t.closest?.<HTMLElement>('.btn') ?? null;
      if (magnet && magnet !== btn) release();
      if (btn) {
        const b = btn.getBoundingClientRect();
        btn.style.setProperty('--px', `${e.clientX - b.left}px`);
        btn.style.setProperty('--py', `${e.clientY - b.top}px`);
        if (!prefersReduced()) {
          gsap.to(btn, {
            x: (e.clientX - (b.left + b.width / 2)) * 0.18,
            y: (e.clientY - (b.top + b.height / 2)) * 0.28,
            duration: 0.5,
            ease: 'power3.out',
          });
        }
        magnet = btn;
      }
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  return null;
}
