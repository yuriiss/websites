import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/glossary';
import { ARTICLES, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '', 'services/', 'about/', 'case-studies/', 'rnd/', 'resources/', 'contact/', 'glossary/',
    'campaign/mcsa-ms-lm/', 'campaign/mcsa-training-2026/',
    ...CATEGORIES.map((c) => `glossary/${c.slug}/`),
    ...ARTICLES.map((a) => `blog-post/${a.slug}/`),
  ];
  return paths.map((p) => ({ url: `${SITE_URL}/${p}` }));
}
