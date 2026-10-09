import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { ARTICLES } from '@/lib/site';
import { LearnMoreCta } from '@/components/ResourcesParts';

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return {};
  return { title: `${a.title} | Maritime.Studio`, description: a.excerpt, alternates: { canonical: `/blog-post/${a.slug}/` } };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <>
      <article className="page-hero">
        <div className="container">
          <div className="article">
            <a className="link-arrow link-back" href="/resources/">
              <Icon name="arrow" />
              <span>Back to Resources</span>
            </a>
            <span className="tag">{a.cat}</span>
            <h1 className="h1">
              <span className="split-line"><span>{a.title}</span></span>
            </h1>
            <div className="article-meta">
              <span>Maritime.Studio Team</span>
              <span>{a.date}</span>
            </div>
            <p className="lead" data-reveal style={{ '--d': '.4s' }}>{a.excerpt}</p>
          </div>
        </div>
      </article>
      <LearnMoreCta />
    </>
  );
}
