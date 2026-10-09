'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { prefersReduced } from '@/lib/motion';
import { getLenis, scrollToTarget } from '@/lib/scroll';

// Liquid page transitions for the App Router.
// Internal link clicks are caught in the capture phase, a two-layer SVG wave
// rises over the page, the router swaps the route, and the wave drains away.
// Without JS (or on any error) links simply navigate as normal.

const rise = (p: number) => {
  const y = 100 - 100 * p;
  const b = Math.sin(Math.PI * p) * 22;
  return `M0 100 L0 ${y.toFixed(2)} C 28 ${(y - b).toFixed(2)} 72 ${(y - b).toFixed(2)} 100 ${y.toFixed(2)} L100 100 Z`;
};
const drain = (p: number) => {
  const y = 100 - 100 * p;
  const b = Math.sin(Math.PI * p) * 22;
  return `M0 0 L0 ${y.toFixed(2)} C 28 ${(y - b).toFixed(2)} 72 ${(y - b).toFixed(2)} 100 ${y.toFixed(2)} L100 0 Z`;
};

function routableUrl(a: HTMLAnchorElement | null, e?: MouseEvent): URL | null {
  if (!a) return null;
  if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return null;
  if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-route')) return null;
  const href = a.getAttribute('href');
  if (!href || /^(mailto:|tel:|javascript:)/i.test(href)) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  if (/\.(pdf|png|jpe?g|webp|svg|zip|xml|txt|json)$/i.test(url.pathname)) return null;
  return url;
}

export function LiquidTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const svgRef = useRef<SVGSVGElement>(null);
  const aRef = useRef<SVGPathElement>(null);
  const bRef = useRef<SVGPathElement>(null);
  const busy = useRef(false);
  const pending = useRef<{ resolve: () => void; hash: string } | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Two wave layers, driven by GSAP: the bright one leads, the deep one follows.
  const playVeil = (shape: (p: number) => string, lead: SVGPathElement | null, follow: SVGPathElement | null, duration: number) =>
    new Promise<void>((resolve) => {
      const s = { a: 0, b: 0 };
      gsap
        .timeline({ onComplete: resolve })
        .to(s, { a: 1, duration, ease: 'power3.inOut', onUpdate: () => lead?.setAttribute('d', shape(s.a)) }, 0)
        .to(s, { b: 1, duration, ease: 'power3.inOut', onUpdate: () => follow?.setAttribute('d', shape(s.b)) }, duration * 0.18);
    });

  const veilIn = () => {
    if (prefersReduced()) return Promise.resolve();
    svgRef.current?.classList.add('is-active');
    getLenis()?.stop();
    return playVeil(rise, aRef.current, bRef.current, 0.62);
  };
  const veilOut = () => {
    getLenis()?.start();
    if (prefersReduced()) {
      svgRef.current?.classList.remove('is-active');
      return Promise.resolve();
    }
    return playVeil(drain, bRef.current, aRef.current, 0.7).then(() => {
      aRef.current?.setAttribute('d', '');
      bRef.current?.setAttribute('d', '');
      svgRef.current?.classList.remove('is-active');
    });
  };

  // Intercept internal link clicks.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
      const url = routableUrl(a, e);
      if (!url) return;
      const samePage = url.pathname === location.pathname && url.search === location.search;
      if (samePage) {
        if (url.hash) return; // native in-page anchor
        e.preventDefault();
        scrollToTarget(0, prefersReduced());
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (busy.current) return;
      busy.current = true;
      const target = url.pathname + url.search + url.hash;
      veilIn().then(() => {
        const arrived = new Promise<void>((resolve) => {
          pending.current = { resolve, hash: url.hash };
        });
        router.push(target, { scroll: false });
        const fallback = new Promise<void>((resolve) => window.setTimeout(resolve, 5000));
        return Promise.race([arrived, fallback]);
      }).then(() => {
        busy.current = false;
        return veilOut();
      });
    };
    const onIntent = (e: Event) => {
      const a = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
      const url = routableUrl(a);
      if (url && url.pathname !== location.pathname) router.prefetch(url.pathname);
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', onIntent);
      document.removeEventListener('focusin', onIntent);
    };
  }, [router]);

  // The new route has rendered: position the page, move focus, let the wave drain.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const hash = pending.current?.hash ?? location.hash;
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) scrollToTarget(target);
    else if (pending.current) scrollToTarget(0);

    const h1 = document.querySelector<HTMLElement>('main h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
    if (statusRef.current) statusRef.current.textContent = `Loaded: ${document.title}`;
    if (!prefersReduced()) {
      const blocks = document.querySelectorAll('main > *');
      gsap.fromTo(blocks, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.06, clearProps: 'transform,opacity,visibility' });
    }
    const p = pending.current;
    pending.current = null;
    // wait a frame so the new page has painted under the veil
    requestAnimationFrame(() => p?.resolve());
  }, [pathname]);

  return (
    <>
      <svg ref={svgRef} className="veil" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="veil-grad-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7BBDE8" />
            <stop offset=".5" stopColor="#4E8EA2" />
            <stop offset="1" stopColor="#0A4174" />
          </linearGradient>
          <linearGradient id="veil-grad-b" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#04141F" />
            <stop offset="1" stopColor="#0A2338" />
          </linearGradient>
        </defs>
        <path ref={aRef} fill="url(#veil-grad-a)" d="" />
        <path ref={bRef} fill="url(#veil-grad-b)" d="" />
      </svg>
      <div ref={statusRef} className="visually-hidden" aria-live="polite" />
    </>
  );
}
