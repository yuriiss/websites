'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Brand } from './Brand';
import { Icon } from './Icon';
import { CAMPAIGN_MENU, NAV, RESOURCES_MENU, isActive, type NavLink } from '@/lib/site';
import { finePointer, prefersReduced } from '@/lib/motion';

export function Header() {
  const pathname = usePathname() || '/';
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const blobRef = useRef<HTMLSpanElement>(null);
  const hoverTimer = useRef<number>(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Header state follows the scroll: glass once scrolled, tucks away on fast scroll down.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        if (y > 480 && y > lastY + 4) setHidden(true);
        else if (y < lastY - 4) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setHidden(false);
  }, [pathname]);

  /* ---- Liquid pill that flows between nav items ---- */
  const currentEl = useCallback((): HTMLElement | null => {
    return navRef.current?.querySelector<HTMLElement>('.nav-item > .nav-link.is-current') ?? null;
  }, []);

  const moveBlob = useCallback((el: HTMLElement | null, instant = false) => {
    const nav = navRef.current;
    const blob = blobRef.current;
    if (!nav || !blob) return;
    if (!el) {
      blob.style.opacity = '0';
      return;
    }
    const nr = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (instant) blob.style.transition = 'none';
    blob.style.width = `${r.width}px`;
    blob.style.transform = `translateX(${r.left - nr.left}px)`;
    blob.style.opacity = '1';
    if (instant) {
      void blob.offsetWidth;
      blob.style.transition = '';
    }
  }, []);

  useEffect(() => {
    moveBlob(currentEl(), true);
    const onResize = () => moveBlob(currentEl(), true);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pathname, currentEl, moveBlob]);

  /* ---- Dropdowns ---- */
  useEffect(() => {
    if (!openMenu) return;
    const onDoc = (e: MouseEvent) => {
      const item = document.getElementById(openMenu)?.closest('.nav-item');
      if (item && !item.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [openMenu]);

  /* ---- Mobile menu ---- */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    if (!mobileOpen) return;
    const first = mobileRef.current?.querySelector<HTMLElement>('a');
    const t = window.setTimeout(() => first?.focus(), prefersReduced() ? 0 : 300);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => window.innerWidth > 1180 && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileOpen]);

  const groupActive = (links: NavLink[]) => links.some((l) => isActive(pathname, l));
  const fine = typeof window !== 'undefined' && finePointer();

  let mobileIndex = 0;
  const mobileDelay = () => ({ transitionDelay: mobileOpen && !prefersReduced() ? `${0.18 + mobileIndex++ * 0.03}s` : '0s' });

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}${hidden && !mobileOpen && !openMenu ? ' is-hidden' : ''}`}>
        <div className="container header-inner">
          <Brand />
          <nav
            className="nav"
            aria-label="Main"
            ref={navRef}
            onPointerOver={(e) => {
              const link = (e.target as HTMLElement).closest<HTMLElement>('.nav-item > .nav-link');
              if (link) moveBlob(link);
            }}
            onPointerLeave={() => moveBlob(currentEl())}
            onFocus={(e) => {
              const link = (e.target as HTMLElement).closest<HTMLElement>('.nav-item > .nav-link');
              if (link) moveBlob(link);
            }}
          >
            <span className="nav-blob" aria-hidden="true" ref={blobRef} />
            {NAV.map((item) => {
              if ('children' in item) {
                const open = openMenu === item.id;
                return (
                  <div
                    className="nav-item"
                    key={item.id}
                    onPointerEnter={() => {
                      if (!fine) return;
                      window.clearTimeout(hoverTimer.current);
                      setOpenMenu(item.id);
                    }}
                    onPointerLeave={() => {
                      if (!fine) return;
                      window.clearTimeout(hoverTimer.current);
                      hoverTimer.current = window.setTimeout(() => setOpenMenu((m) => (m === item.id ? null : m)), 220);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setOpenMenu(null);
                        (e.currentTarget.querySelector('button') as HTMLButtonElement)?.focus();
                      }
                      if (e.key === 'ArrowDown' && (e.target as HTMLElement).tagName === 'BUTTON') {
                        e.preventDefault();
                        setOpenMenu(item.id);
                        requestAnimationFrame(() =>
                          document.getElementById(item.id)?.querySelector<HTMLElement>('a')?.focus(),
                        );
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenMenu((m) => (m === item.id ? null : m));
                    }}
                  >
                    <button
                      className={`nav-link${groupActive(item.children) ? ' is-current' : ''}`}
                      type="button"
                      aria-expanded={open}
                      aria-controls={item.id}
                      onClick={() => setOpenMenu(open ? null : item.id)}
                    >
                      {item.label}
                      <Icon name="chev" className="chev" />
                    </button>
                    <div className={`dropdown${open ? ' is-open' : ''}`} id={item.id}>
                      {item.children.map((c) => (
                        <a key={c.href} href={c.href} aria-current={isActive(pathname, c) ? 'page' : undefined}>
                          {c.label}
                          <span>{c.hint}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }
              const active = isActive(pathname, item);
              return (
                <div className="nav-item" key={item.href}>
                  <a className={`nav-link${active ? ' is-current' : ''}`} href={item.href} aria-current={active ? 'page' : undefined}>
                    {item.label}
                  </a>
                </div>
              );
            })}
          </nav>
          <a className="btn btn--primary btn--sm header-cta" href="/contact/">Book Consultation</a>
          <button
            ref={toggleRef}
            className="nav-toggle"
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu${mobileOpen ? ' is-open' : ''}`} id="mobile-menu" ref={mobileRef}>
        <nav aria-label="Mobile">
          {NAV.filter((i): i is NavLink => !('children' in i)).map((l) => (
            <a key={l.href} href={l.href} aria-current={isActive(pathname, l) ? 'page' : undefined} style={mobileDelay()}>
              {l.label}
            </a>
          ))}
          {[
            ['Resources', RESOURCES_MENU],
            ['Campaign', CAMPAIGN_MENU],
          ].map(([label, links]) => (
            <div key={label as string}>
              <p className="mm-label">{label as string}</p>
              <div className="sub">
                {(links as NavLink[]).map((l) => (
                  <a key={l.href} href={l.href} aria-current={isActive(pathname, l) ? 'page' : undefined} style={mobileDelay()}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <a className="btn btn--primary" href="/contact/">
          Book Consultation <Icon name="arrow" />
        </a>
      </div>
    </>
  );
}
