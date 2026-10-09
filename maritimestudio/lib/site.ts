export const SITE_URL = 'https://maritimestudio.no';
export const CONTACT_EMAIL = 'info@maritime.studio';
export const OG_IMAGE =
  'https://media.base44.com/images/public/69cfb6e0e996f314b6bd9acc/79cb2cdd8_maritimestudio-og-1200x630.png/v1/fill/w_1200,h_630/79cb2cdd8_maritimestudio-og-1200x630.png';

export type NavLink = { href: string; label: string; hint?: string; prefix?: boolean };
export type NavItem = NavLink | { label: string; id: string; children: NavLink[] };

export const RESOURCES_MENU: NavLink[] = [
  { href: '/resources/', label: 'Articles & Insights', hint: 'Guides and thought leadership' },
  { href: '/glossary/', label: 'Maritime Glossary', hint: '558+ terms explained', prefix: true },
];

export const CAMPAIGN_MENU: NavLink[] = [
  { href: '/campaign/mcsa-ms-lm/', label: 'Cyber Security Awareness', hint: 'Online CPD course · 5 simulators' },
  { href: '/campaign/mcsa-training-2026/', label: 'Cybersecurity Training 2026', hint: 'Sea, yard & shore tracks' },
];

export const NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services' },
  { href: '/about/', label: 'About' },
  { href: '/case-studies/', label: 'Case Studies' },
  { href: '/rnd/', label: 'R&D' },
  { label: 'Resources', id: 'menu-resources', children: RESOURCES_MENU },
  { href: '/contact/', label: 'Contact' },
  { label: 'Campaign', id: 'menu-campaign', children: CAMPAIGN_MENU },
];

export function isActive(pathname: string, link: NavLink): boolean {
  const here = normalize(pathname);
  const target = normalize(link.href);
  if (target === '/') return here === '/';
  return here === target || (!!link.prefix && here.startsWith(target));
}

export function normalize(path: string): string {
  let p = path.replace(/index\.html$/, '');
  if (!p.endsWith('/')) p += '/';
  return p;
}

export type Article = {
  slug: string;
  cat: 'Industry Insights' | 'Technology' | 'Training' | 'Safety & Compliance' | 'Digital Marketing';
  date: string;
  title: string;
  excerpt: string;
};

export const ARTICLE_CATEGORIES: Article['cat'][] = [
  'Industry Insights',
  'Technology',
  'Training',
  'Safety & Compliance',
  'Digital Marketing',
];

export const ARTICLES: Article[] = [
  {
    slug: 'vr-crew-safety', cat: 'Technology', date: 'Mar 20, 2026',
    title: 'The Future of Maritime Training: How VR is Transforming Crew Safety',
    excerpt: 'Virtual reality is reshaping how maritime crews prepare for emergency scenarios. We explore the latest developments and ROI data from leading shipping companies.',
  },
  {
    slug: 'stcw-2025-updates', cat: 'Safety & Compliance', date: 'Mar 10, 2026',
    title: 'STCW 2025 Updates: What Training Providers Need to Know',
    excerpt: "The latest STCW amendments bring significant changes to certification requirements. Here's our comprehensive breakdown of what's changing and how to prepare.",
  },
  {
    slug: 'maritime-seo-strategies', cat: 'Digital Marketing', date: 'Feb 28, 2026',
    title: '5 SEO Strategies That Actually Work for Maritime Companies',
    excerpt: 'Maritime SEO requires a specialized approach. We share the strategies that have consistently doubled qualified leads for our maritime clients.',
  },
  {
    slug: 'digital-first-training-program', cat: 'Training', date: 'Feb 15, 2026',
    title: 'Building a Digital-First Maritime Training Program: A Step-by-Step Guide',
    excerpt: 'A comprehensive guide to transitioning from traditional classroom training to a modern, digital-first approach without losing effectiveness.',
  },
  {
    slug: 'imo-2030-decarbonization', cat: 'Industry Insights', date: 'Feb 1, 2026',
    title: 'IMO 2030: How Digital Transformation Supports Decarbonization Goals',
    excerpt: 'Exploring the role of digital technology in helping the maritime industry meet its ambitious environmental targets.',
  },
  {
    slug: 'marine-software-ux', cat: 'Technology', date: 'Jan 20, 2026',
    title: 'Designing Marine Software UX for High-Stress Environments',
    excerpt: 'Key principles for designing user interfaces that perform reliably when crews are under pressure — lessons from real bridge and engine room software.',
  },
];
