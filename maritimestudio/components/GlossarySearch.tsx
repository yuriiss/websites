'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Icon } from './Icon';

// Live search for the glossary. "hub" lists every term name A–Z with a link to
// its category page; "terms" shows full definitions for one category.

export type HubEntry = { id: string; term: string; tag: string; href: string };
export type TermEntry = { id: string; term: string; tag: string; def: string };

function SearchBox({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="search" role="search">
      <Icon name="search" />
      <label className="visually-hidden" htmlFor={id}>{label}</label>
      <input id={id} type="search" placeholder={placeholder} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function group<T extends { term: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  items.forEach((t) => {
    const ch = t.term.trim().charAt(0).toUpperCase();
    const k = /[A-Z0-9]/.test(ch) ? ch : '#';
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  });
  return Array.from(map.entries());
}

export function HubSearch({ entries }: { entries: HubEntry[] }) {
  const [q, setQ] = useState('');
  const query = useDeferredValue(q.trim().toLowerCase());
  const shown = useMemo(() => (query ? entries.filter((e) => `${e.term} ${e.tag}`.toLowerCase().includes(query)) : entries), [entries, query]);
  const groups = useMemo(() => {
    const g = group(shown);
    return g.sort(([a], [b]) => (/\d/.test(a) === /\d/.test(b) ? a.localeCompare(b) : /\d/.test(a) ? -1 : 1));
  }, [shown]);

  return (
    <>
      <SearchBox id="hub-search" label="Search all glossary terms" placeholder={`Search ${entries.length} terms — e.g. drive-off, ammonia, IEC 62443`} value={q} onChange={setQ} />
      <p className="search-count" aria-live="polite">
        {query ? `${shown.length} of ${entries.length} terms match “${q.trim()}”` : `${entries.length} terms`}
      </p>
      <div className="az" style={{ marginTop: 28 }}>
        {groups.map(([letter, items]) => (
          <div className="az-group" key={letter}>
            <h3>{letter}</h3>
            <ul>
              {items.map((t) => (
                <li key={t.href}>
                  <a href={t.href}>
                    {t.term}
                    <small>{t.tag}</small>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {shown.length === 0 && <p className="empty-state is-visible">No terms match your search. Try a shorter word or an abbreviation.</p>}
    </>
  );
}

export function TermSearch({ terms, categoryName }: { terms: TermEntry[]; categoryName: string }) {
  const [q, setQ] = useState('');
  const query = useDeferredValue(q.trim().toLowerCase());
  const shown = useMemo(() => (query ? terms.filter((t) => `${t.term} ${t.def} ${t.tag}`.toLowerCase().includes(query)) : terms), [terms, query]);
  const groups = useMemo(() => group(shown), [shown]);

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <SearchBox id="term-search" label={`Search ${categoryName} terms`} placeholder={`Filter ${terms.length} terms and definitions`} value={q} onChange={setQ} />
      </div>
      <p className="search-count" aria-live="polite">
        {query ? `${shown.length} of ${terms.length} terms match “${q.trim()}”` : `${terms.length} terms`}
      </p>
      {!query && (
        <nav className="letters" aria-label="Jump to letter">
          {groups.map(([k]) => (
            <a key={k} href={`#letter-${k}`}>{k}</a>
          ))}
        </nav>
      )}
      {groups.map(([k, items]) => (
        <section className="term-group" id={`letter-${k}`} aria-labelledby={`h-letter-${k}`} key={k}>
          <h2 className="term-letter" id={`h-letter-${k}`}>{k}</h2>
          <dl className="terms">
            {items.map((t) => (
              <div className="term" id={t.id} key={t.id}>
                <dt>
                  <a className="anchor" href={`#${t.id}`}>
                    <strong>{t.term}</strong>
                  </a>
                  <span className="tag tag--warm">{t.tag}</span>
                </dt>
                <dd>{t.def}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {shown.length === 0 && (
        <p className="empty-state is-visible">
          No terms match your search in this category. <a href="/glossary/">Search the whole glossary</a>.
        </p>
      )}
    </>
  );
}
