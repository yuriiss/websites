'use client';

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { prefersReduced } from '@/lib/motion';

gsap.registerPlugin(Flip);

// Category chips over a card grid. Cards that stay glide to their new place
// (GSAP Flip); cards that leave dissolve; new ones rise in.

type Item = { key: string; cat: string; node: ReactNode };

export function FilterGrid({
  categories,
  items,
  label,
  gridClass = 'grid grid-3',
}: {
  categories: string[];
  items: Item[];
  label: string;
  gridClass?: string;
}) {
  const [active, setActive] = useState('all');
  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const select = (cat: string) => {
    if (cat === active) return;
    if (gridRef.current && !prefersReduced()) {
      flipState.current = Flip.getState(gridRef.current.children);
    }
    setActive(cat);
  };

  useLayoutEffect(() => {
    if (!flipState.current) return;
    Flip.from(flipState.current, {
      duration: 0.7,
      ease: 'power3.inOut',
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 24, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.96, duration: 0.4 }),
    });
    flipState.current = null;
  }, [active]);

  const visible = items.filter((i) => active === 'all' || i.cat === active);

  return (
    <>
      <div className="filters" role="group" aria-label={label}>
        {['all', ...categories].map((c) => (
          <button key={c} className="filter" type="button" aria-pressed={active === c} onClick={() => select(c)}>
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'item' : 'items'} shown
      </p>
      <div className={gridClass} ref={gridRef} data-reveal>
        {visible.map((i) => (
          <div key={i.key} data-flip-id={i.key} className="filter-cell">
            {i.node}
          </div>
        ))}
      </div>
    </>
  );
}
