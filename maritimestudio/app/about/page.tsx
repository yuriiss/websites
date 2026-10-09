import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: "About Maritime.Studio — Our Mission, Team & Values",
  description: "Maritime.Studio was founded in Ålesund, Norway to bridge maritime expertise with digital innovation — building safer, smarter and more compliant shipping operations.",
  alternates: { canonical: '/about/' },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About Us</span>
          <h1 className="h1"><span className="split-line"><span>Where Maritime Knowledge</span></span><span className="split-line"><span>Meets <em>Digital Innovation</em></span></span></h1>
          <p className="lead" data-reveal style={{ '--d': '.4s' }}>Maritime.Studio was founded on a simple belief: the maritime industry deserves digital solutions that are as robust and reliable as the vessels that power global trade. Our team combines deep industry expertise with cutting-edge technology to deliver transformation that truly works.</p>
        </div>
      </section>

      <section className="section section--tint" aria-label="Mission and vision">
        <div className="container">
          <div className="grid grid-2" data-stagger="0.1">
            <article className="glass glass--lift" data-reveal>
              <span className="icon-bubble"><Icon name="compass" /></span>
              <span className="eyebrow eyebrow--plain">Mission</span>
              <h2 className="h2" style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}>Our Mission</h2>
              <p className="lead">To empower maritime organizations with innovative digital solutions that enhance safety, optimize training, ensure compliance, and drive operational efficiency — making the seas safer and the industry more sustainable.</p>
            </article>
            <article className="glass glass--lift" data-reveal>
              <span className="icon-bubble icon-bubble--warm"><Icon name="radar" /></span>
              <span className="eyebrow eyebrow--plain eyebrow--warm">Vision</span>
              <h2 className="h2" style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}>Our Vision</h2>
              <p className="lead">To be the premier digital partner for the global maritime industry — recognized for our domain expertise, technical excellence, and the measurable impact we deliver to every client.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container split">
          <div className="sticky-col" data-reveal>
            <span className="eyebrow">Our Values</span>
            <h2 className="h2" id="values-title">What Guides Us</h2>
          </div>
          <div className="mosaic" data-stagger="0.07">
            <div data-reveal><span className="icon-bubble"><Icon name="anchor" /></span><h3 className="h4">Maritime First</h3><p>Every solution is designed with the unique demands and regulations of the maritime industry at its core.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="chart" /></span><h3 className="h4">Results Driven</h3><p>We measure success by the tangible impact our solutions deliver — improved safety, reduced costs, better compliance.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="users" /></span><h3 className="h4">Collaborative</h3><p>We work as an extension of your team, ensuring deep understanding and seamless integration.</p></div>
            <div data-reveal><span className="icon-bubble icon-bubble--warm"><Icon name="globe" /></span><h3 className="h4">Globally Minded</h3><p>Supporting maritime organizations across continents with multilingual, cross-cultural digital solutions.</p></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '0' }} aria-labelledby="about-cta">
        <div className="container">
          <div className="cta" data-reveal>
            <span className="cta-blob cta-blob--a" aria-hidden="true"></span><span className="cta-blob cta-blob--b" aria-hidden="true"></span>
            <h2 className="h2" id="about-cta">Let's Build Something Remarkable Together</h2>
            <p className="lead">Ready to bring your maritime digital vision to life? We'd love to hear about your project.</p>
            <div className="btn-row" style={{ justifyContent: 'center' }}><a className="btn btn--sand" href="/contact/">Get in Touch <Icon name="arrow" /></a></div>
          </div>
        </div>
      </section>
    </>
  );
}
