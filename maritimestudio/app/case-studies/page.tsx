import type { Metadata } from 'next';
import { Cta } from '@/components/Cta';
import { FilterGrid } from '@/components/FilterGrid';
import { Icon, type IconName } from '@/components/Icon';
import { Ocean } from '@/components/Ocean';

export const metadata: Metadata = {
  title: 'Maritime Digital Transformation Case Studies & Results | Maritime.Studio',
  description:
    'See how Maritime.Studio has delivered measurable results — custom LMS deployments, VR simulators, port authority web overhauls and ISM compliance audits.',
  alternates: { canonical: '/case-studies/' },
};

const CATEGORIES = ['Training & Education', 'Immersive Technology', 'Digital Presence & Development', 'Consulting Services'];

const CASES: { key: string; cat: string; icon: IconName; title: string; client: string; text: string; result: string }[] = [
  {
    key: 'lms-fleet', cat: 'Training & Education', icon: 'cap',
    title: 'Custom LMS for Global Shipping Fleet', client: 'Nordic Shipping Co.',
    text: 'Built a multilingual learning management system supporting 3,000+ crew members across 45 vessels with offline-capable training modules.',
    result: '40% improvement in compliance rates, 60% reduction in training costs',
  },
  {
    key: 'vr-sim', cat: 'Immersive Technology', icon: 'vr',
    title: 'VR Emergency Response Simulator', client: 'Pacific Maritime Group',
    text: 'Developed a VR-based fire and abandon ship drill simulator used across 12 training centers worldwide.',
    result: '85% higher knowledge retention vs traditional methods',
  },
  {
    key: 'port-authority', cat: 'Digital Presence & Development', icon: 'globe',
    title: 'Complete Digital Overhaul for Port Authority', client: 'East African Marine Services',
    text: 'Redesigned website, implemented maritime SEO strategy, and launched targeted PPC campaigns for a major port authority.',
    result: '200% increase in qualified web leads in 6 months',
  },
  {
    key: 'ism-audit', cat: 'Consulting Services', icon: 'compass',
    title: 'ISM Code Safety Audit & Digital Transformation', client: 'Mediterranean Tankers Ltd.',
    text: 'Conducted comprehensive technical audit and implemented digital safety management system across the fleet.',
    result: 'Zero major audit findings in subsequent PSC inspections',
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <section className="page-hero">
        <Ocean soft />
        <div className="container">
          <span className="eyebrow">Our Work</span>
          <h1 className="h1">
            <span className="split-line"><span>Case Studies &amp;</span></span>
            <span className="split-line"><span><em>Success Stories</em></span></span>
          </h1>
          <p className="lead" data-reveal style={{ '--d': '.4s' }}>
            Real results for real maritime organizations. Explore how we&apos;ve helped our clients navigate their digital transformation.
          </p>
        </div>
      </section>

      <section className="section section--tight" style={{ paddingTop: 0 }} aria-label="Case studies">
        <div className="container">
          <FilterGrid
            label="Filter case studies"
            categories={CATEGORIES}
            gridClass="grid grid-2"
            items={CASES.map((c) => ({
              key: c.key,
              cat: c.cat,
              node: (
                <article className="glass glass--lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span className="tag">{c.cat}</span>
                    <span className="icon-bubble"><Icon name={c.icon} /></span>
                  </div>
                  <h2 className="h3">{c.title}</h2>
                  <p className="mono small faint">{c.client}</p>
                  <p>{c.text}</p>
                  <p className="result"><b>Key Results:</b> {c.result}</p>
                </article>
              ),
            }))}
          />
        </div>
      </section>

      <Cta id="cs-cta" title="Ready to become our next success story?">
        <a className="btn btn--sand" href="/contact/">Start Your Project <Icon name="arrow" /></a>
      </Cta>
    </>
  );
}
