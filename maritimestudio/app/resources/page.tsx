import type { Metadata } from 'next';
import { ArticleGrid } from '@/components/ArticleGrid';
import { LearnMoreCta, ResourcesHero } from '@/components/ResourcesParts';

export const metadata: Metadata = {
  title: 'Maritime Industry Insights, Guides & Thought Leadership | Maritime.Studio',
  description:
    'Expert articles on maritime technology, STCW compliance, VR training, decarbonisation, AI, and digital transformation — written for maritime professionals.',
  alternates: { canonical: '/resources/' },
};

export default function ResourcesPage() {
  return (
    <>
      <ResourcesHero />
      <section className="section section--tight" style={{ paddingTop: 0 }} aria-label="Articles">
        <div className="container">
          <ArticleGrid />
        </div>
      </section>
      <LearnMoreCta />
    </>
  );
}
