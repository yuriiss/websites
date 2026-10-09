'use client';

import { useEffect, useRef, useState } from 'react';

// Sticky in-page index for the services page; the chip of the section you are
// reading lights up and scrolls into view.
const SECTIONS: [string, string][] = [
  ['training', 'Training & Education'],
  ['immersive', 'Immersive Technology'],
  ['digital', 'Digital Presence'],
  ['consulting', 'Consulting'],
  ['content', 'Content & PR'],
  ['lms', 'Maritime.LMS'],
];

export function ServiceIndex() {
  const [current, setCurrent] = useState<string | null>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setCurrent(en.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const a = bar.current?.querySelector<HTMLElement>(`a[href="#${current}"]`);
    if (a && bar.current) bar.current.scrollTo({ left: a.offsetLeft - bar.current.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
  }, [current]);

  return (
    <div className="container service-index">
      <nav className="filters" aria-label="Service areas" ref={bar}>
        {SECTIONS.map(([id, label]) => (
          <a key={id} className={`filter${current === id ? ' is-active' : ''}`} href={`#${id}`} aria-current={current === id ? 'location' : undefined}>
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
