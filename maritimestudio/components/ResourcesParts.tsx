import { Cta } from './Cta';
import { Icon } from './Icon';

export function ResourcesHero() {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">Resources</span>
        <h1 className="h1">
          <span className="split-line"><span>Maritime Insights &amp;</span></span>
          <span className="split-line"><span><em>Thought Leadership</em></span></span>
        </h1>
        <p className="lead" data-reveal style={{ '--d': '.4s' }}>
          Stay informed with the latest trends, best practices, and innovations in maritime technology and training.
        </p>
        <div className="btn-row" data-reveal style={{ '--d': '.5s' }}>
          <a className="btn btn--ghost" href="/glossary/"><Icon name="book" /> Maritime Glossary — 558+ terms</a>
        </div>
      </div>
    </section>
  );
}

export function LearnMoreCta() {
  return (
    <Cta id="res-cta" title="Want to Learn More?" lead="Book a free consultation to discuss how our solutions can address your specific maritime challenges.">
      <a className="btn btn--sand" href="/contact/">Get in Touch <Icon name="arrow" /></a>
    </Cta>
  );
}
