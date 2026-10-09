import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: "Maritime.Studio — Maritime EdTech & Digital Solutions",
  description: "Custom LMS platforms, VR/AR safety simulators, cybersecurity training, web development and consulting built for the global maritime industry.",
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container">
          <div className="hero-grid hero-grid--solo">
            <div className="hero-copy" data-parallax="0.08">
              <span className="eyebrow">Maritime Digital Solutions</span>
              <h1 className="display" id="hero-title">
                <span className="split-line"><span>Navigate the</span></span>
                <span className="split-line"><span>Future of <em>Maritime</em></span></span>
                <span className="split-line"><span>Innovation</span></span>
              </h1>
              <p className="lead" data-reveal style={{ '--d': '.5s' }}>We bridge traditional maritime operations with cutting-edge digital technology — enhancing safety, training, compliance, and operational efficiency for the global maritime industry.</p>
              <div className="btn-row" data-reveal style={{ '--d': '.65s' }}>
                <a className="btn btn--primary" href="/contact/">Book a Consultation <Icon name="arrow" /></a>
                <a className="btn btn--ghost" href="/services/">Explore Services</a>
              </div>
            </div>

          </div>
      </div>
        <a className="scroll-cue" href="#pillars">SCROLL<i></i></a>
      </section>

      <section className="section section--tint" id="pillars" aria-labelledby="pillars-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <span className="eyebrow">What We Do</span>
            <h2 className="h2" id="pillars-title">Four Pillars of Maritime Excellence</h2>
            <p className="lead">Comprehensive digital solutions tailored to the unique demands of the maritime industry</p>
          </div>
          <div className="grid grid-4" data-stagger="0.08">
            <a className="glass" href="/services/#training" data-reveal>
              <span className="icon-bubble"><Icon name="cap" /></span>
              <h3 className="h3">Training &amp; Education</h3>
              <p>Custom LMS platforms, compliance training modules, crew assessment tools, and online upskilling courses designed for the maritime workforce.</p>
              <ul className="tick-list"><li>Custom LMS Development</li><li>Compliance Training Modules</li><li>Crew Assessment Tools</li><li>Online Upskilling Courses</li></ul>
              <span className="link-arrow card-foot">Learn More <Icon name="arrow" /></span>
            </a>
            <a className="glass" href="/services/#immersive" data-reveal>
              <span className="icon-bubble"><Icon name="vr" /></span>
              <h3 className="h3">Immersive Technology</h3>
              <p>VR/AR safety simulators and immersive experience applications that transform maritime training and operational procedures.</p>
              <ul className="tick-list"><li>VR/AR Safety Simulators</li><li>VR Experience Apps</li></ul>
              <span className="link-arrow card-foot">Learn More <Icon name="arrow" /></span>
            </a>
            <a className="glass" href="/services/#digital" data-reveal>
              <span className="icon-bubble"><Icon name="globe" /></span>
              <h3 className="h3">Digital Presence &amp; Development</h3>
              <p>Maritime-specialized web development, community platforms, UX/UI design, SEO, PPC campaigns, and social media management.</p>
              <ul className="tick-list"><li>Maritime Niche Web Dev</li><li>Community Platforms</li><li>UX/UI Design</li><li>Maritime SEO &amp; PPC</li><li>Social Media Management</li></ul>
              <span className="link-arrow card-foot">Learn More <Icon name="arrow" /></span>
            </a>
            <a className="glass" href="/services/#consulting" data-reveal>
              <span className="icon-bubble"><Icon name="compass" /></span>
              <h3 className="h3">Consulting Services</h3>
              <p>Expert technical consultation, comprehensive audits, and safety consulting to ensure operational excellence and regulatory compliance.</p>
              <ul className="tick-list"><li>Technical Consultation</li><li>Technical Audits</li><li>Safety Consulting</li></ul>
              <span className="link-arrow card-foot">Learn More <Icon name="arrow" /></span>
            </a>
          </div>
        </div>
      </section>

      <section className="section section--fade section--tight" aria-label="Key figures">
        <div className="container">
          <div className="stats">
            <div className="stat"><div className="stat-num" data-count="50" data-suffix="+">50+</div><div className="stat-label">Projects Delivered</div></div>
            <div className="stat"><div className="stat-num" data-count="10" data-suffix="+">10+</div><div className="stat-label">Maritime Clients</div></div>
            <div className="stat stat--warm"><div className="stat-num" data-count="98" data-suffix="%">98%</div><div className="stat-label">Client Satisfaction</div></div>
            <div className="stat"><div className="stat-num" data-count="12" data-suffix="+">12+</div><div className="stat-label">Years Experience</div></div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="why-title">
        <div className="container split">
          <div className="sticky-col" data-reveal>
            <span className="eyebrow eyebrow--warm">Why Maritime.Studio</span>
            <h2 className="h2" id="why-title">Your Trusted Maritime Digital Partner</h2>
            <p className="lead">We combine deep maritime expertise with world-class digital capabilities</p>
            <div className="btn-row"><a className="btn btn--ghost" href="/about/">About Us <Icon name="arrow" /></a></div>
          </div>
          <div className="mosaic" data-stagger="0.06">
            <div data-reveal><span className="icon-bubble"><Icon name="anchor" /></span><h3 className="h4">Maritime Expertise</h3><p>Deep industry knowledge ensures solutions that truly fit maritime workflows and regulations.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="spark" /></span><h3 className="h4">Cutting-Edge Technology</h3><p>VR/AR, custom LMS, and modern web solutions that push boundaries in maritime tech.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="shield" /></span><h3 className="h4">Compliance Focused</h3><p>Every solution is built with IMO, STCW, and industry regulatory frameworks in mind.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="users" /></span><h3 className="h4">End-to-End Partnership</h3><p>From strategy through deployment and ongoing support — we're with you at every stage.</p></div>
            <div data-reveal><span className="icon-bubble icon-bubble--warm"><Icon name="star" /></span><h3 className="h4">Proven Track Record</h3><p>150+ projects delivered for maritime organizations across the globe.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="target" /></span><h3 className="h4">Client-First Approach</h3><p>Tailored solutions, transparent communication, and a 98% client satisfaction rate.</p></div>
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="testimonials-title">
        <div className="container">
          <div className="section-head section-head--center" data-reveal>
            <span className="eyebrow">Testimonials</span>
            <h2 className="h2" id="testimonials-title">Trusted by Maritime Leaders</h2>
            <p className="lead">See what our clients say about working with Maritime.Studio</p>
          </div>
          <div className="grid grid-3" data-stagger="0.1">
            <figure className="glass glass--lift quote" data-reveal>
              <span className="quote-mark" aria-hidden="true">&ldquo;</span>
              <blockquote>"Maritime.Studio transformed our crew training program with their custom LMS. We've seen a 40% improvement in compliance rates and significantly reduced training costs."</blockquote>
              <figcaption><strong>Captain Henrik Johansson</strong>Director of Training, Nordic Shipping Co.</figcaption>
            </figure>
            <figure className="glass glass--lift quote" data-reveal>
              <span className="quote-mark" aria-hidden="true">&ldquo;</span>
              <blockquote>"The VR safety simulator they built has revolutionized how we prepare our crew for emergency scenarios. It's the most impactful training investment we've made."</blockquote>
              <figcaption><strong>Sarah Chen</strong>Safety Manager, Pacific Maritime Group</figcaption>
            </figure>
            <figure className="glass glass--lift quote" data-reveal>
              <span className="quote-mark" aria-hidden="true">&ldquo;</span>
              <blockquote>"Their maritime SEO expertise doubled our qualified leads within six months. They truly understand the industry and know how to reach the right decision-makers."</blockquote>
              <figcaption><strong>James Mwangi</strong>CEO, East African Marine Services</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta" data-reveal>
            <span className="cta-blob cta-blob--a" aria-hidden="true"></span><span className="cta-blob cta-blob--b" aria-hidden="true"></span>
            <h2 className="h2" id="cta-title">Ready to Transform Your Maritime Operations?</h2>
            <p className="lead">Let's discuss how our digital solutions can enhance your safety standards, streamline crew training, and drive your organization's digital transformation.</p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <a className="btn btn--sand" href="/contact/">Schedule a Consultation <Icon name="arrow" /></a>
              <a className="btn btn--ghost" href="/services/">View Our Services</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
