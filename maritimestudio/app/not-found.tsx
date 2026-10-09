import { Icon } from '@/components/Icon';

export default function NotFound() {
  return (
    <>
      <section className="page-hero page-hero--center" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <span className="eyebrow">404 · Off course</span>
          <h1 className="h1"><span className="split-line"><span>This page has drifted</span></span><span className="split-line"><span><em>out of range</em></span></span></h1>
          <p className="lead">The link may be outdated or the page has moved. Let's get you back to safe harbour.</p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <a className="btn btn--primary" href="/">Back to Home <Icon name="arrow" /></a>
            <a className="btn btn--ghost" href="/glossary/">Search the Glossary</a>
          </div>
        </div>
      </section>
    </>
  );
}
