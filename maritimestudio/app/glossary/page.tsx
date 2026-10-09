import type { Metadata } from 'next';
import { HubSearch, type HubEntry } from '@/components/GlossarySearch';
import { Icon } from '@/components/Icon';
import { CARD_COPY, CARD_ICON, CATEGORIES, TOTAL_TERMS } from '@/lib/glossary';
import { GlossaryCta } from './GlossaryCta';

export const metadata: Metadata = {
  title: 'Maritime Glossary Hub — 558+ Terms: DP, Alternative Fuels, Cybersecurity, Autonomous Ships & More | Maritime.Studio',
  description:
    "The maritime industry's reference glossary: 558+ terms across dynamic positioning, alternative fuels, battery energy storage, maritime cybersecurity (325 terms), autonomous vessels, training, vessel operations and regulation. By Maritime.Studio, Ålesund.",
  alternates: { canonical: '/glossary/' },
};

export default function GlossaryHub() {
  const entries: HubEntry[] = CATEGORIES.flatMap((c) =>
    c.terms.map((t) => ({ id: t.id, term: t.term, tag: t.tag, href: `/glossary/${c.slug}/#${t.id}` })),
  );

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Maritime Glossary · {TOTAL_TERMS} terms</span>
          <h1 className="h1">
            <span className="split-line"><span>The Maritime</span></span>
            <span className="split-line"><span><em>Glossary</em></span></span>
          </h1>
          <p className="lead" data-reveal style={{ '--d': '.4s' }}>
            558+ maritime terms explained in plain language — from dynamic positioning and FMEA to alternative fuels, battery energy storage,
            maritime cybersecurity, autonomous vessels, training, operations and regulation. Built and maintained by Maritime.Studio, a maritime
            EdTech and consulting partner in Ålesund, Norway.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="grid grid-4" data-stagger="0.06">
            {CATEGORIES.map((c) => (
              <a className="glass cat-card" href={`/glossary/${c.slug}/`} key={c.slug} data-reveal>
                <span className="icon-bubble"><Icon name={CARD_ICON[c.slug] ?? 'book'} /></span>
                <h3 className="h3">{c.name}</h3>
                <span className="count">{c.terms.length} terms</span>
                <p>{CARD_COPY[c.slug]}</p>
                <span className="link-arrow card-foot">Browse {c.name} <Icon name="arrow" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Index</span>
            <h2 className="h2">All terms A–Z</h2>
          </div>
          <HubSearch entries={entries} />
        </div>
      </section>

      <GlossaryCta />
    </>
  );
}
