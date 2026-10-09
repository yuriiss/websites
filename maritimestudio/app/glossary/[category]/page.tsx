import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TermSearch } from '@/components/GlossarySearch';
import { Icon } from '@/components/Icon';
import { Ocean } from '@/components/Ocean';
import { CATEGORIES } from '@/lib/glossary';
import { GlossaryCta } from '../GlossaryCta';

type Params = { category: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const c = CATEGORIES.find((x) => x.slug === category);
  if (!c) return {};
  return { title: c.title, description: c.desc, alternates: { canonical: `/glossary/${c.slug}/` } };
}

export default async function GlossaryCategory({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const c = CATEGORIES.find((x) => x.slug === category);
  if (!c) notFound();

  return (
    <>
      <section className="page-hero">
        <Ocean soft intensity={0.8} />
        <div className="container">
          <a className="link-arrow link-back" href="/glossary/">
            <Icon name="arrow" />
            <span>All categories</span>
          </a>
          <span className="eyebrow">Glossary · {c.terms.length} terms</span>
          <h1 className="h1">
            <span className="split-line"><span>{c.name}</span></span>
          </h1>
          <p className="lead">{c.intro}</p>
        </div>
      </section>

      <section className="section section--tight" style={{ paddingTop: 0 }}>
        <div className="container">
          <nav className="cat-tabs" aria-label="Glossary categories" style={{ marginBottom: 24 }}>
            {CATEGORIES.map((x) => (
              <a key={x.slug} href={`/glossary/${x.slug}/`} aria-current={x.slug === c.slug ? 'page' : undefined}>
                {x.name}
              </a>
            ))}
          </nav>
          <TermSearch terms={c.terms} categoryName={c.name} />
        </div>
      </section>

      <GlossaryCta />
    </>
  );
}
