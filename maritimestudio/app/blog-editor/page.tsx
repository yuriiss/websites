import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { Ocean } from '@/components/Ocean';

export const metadata: Metadata = {
  title: "Blog Editor | Maritime.Studio",
  description: "Blog Editor on Maritime.Studio.",
  alternates: { canonical: '/blog-editor/' },
  robots: { index: false, follow: false },
};

export default function BlogEditorPage() {
  return (
    <>
      <section className="page-hero page-hero--center" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <Ocean soft intensity={0.6} />
        <div className="container">
          <span className="icon-bubble icon-bubble--warm" style={{ width: '64px', height: '64px' }}><Icon name="lock" /></span>
          <h1 className="h1"><span className="split-line"><span>Access restricted</span></span></h1>
          <p className="lead">Only administrators can create and edit blog posts.</p>
          <div className="btn-row" style={{ justifyContent: 'center' }}><a className="btn btn--ghost" href="/resources/">Back to Resources</a></div>
        </div>
      </section>
    </>
  );
}
