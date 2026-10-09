import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { Ocean } from '@/components/Ocean';
import { ValidatedForm } from '@/components/ValidatedForm';

export const metadata: Metadata = {
  title: "Contact Maritime.Studio — Book a Free Consultation",
  description: "Get in touch with Maritime.Studio to discuss your maritime digital project. We respond within 24 hours and offer free 30-minute discovery calls.",
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <Ocean soft />
        <div className="container">
          <span className="eyebrow">Get in Touch</span>
          <h1 className="h1"><span className="split-line"><span>Let's Start a</span></span><span className="split-line"><span><em>Conversation</em></span></span></h1>
          <p className="lead" data-reveal style={{ '--d': '.4s' }}>Ready to transform your maritime operations? Tell us about your project and we'll respond within 24 hours.</p>
        </div>
      </section>

      <section className="section section--tight" style={{ paddingTop: '0' }} aria-label="Contact">
        <div className="container split split--form">
          <ValidatedForm className="glass glass--flat" subject="Consultation request — Maritime.Studio website" success="Thank you — your inquiry is on its way. We'll respond within 24 hours.">
            <h2 className="h3">Request a Consultation</h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="c-name">Full Name *</label>
                <input id="c-name" name="name" type="text" autoComplete="name" placeholder="Captain John Smith" required />
                <span className="field-error" aria-live="polite"></span>
              </div>
              <div className="field">
                <label htmlFor="c-email">Email *</label>
                <input id="c-email" name="email" type="email" autoComplete="email" placeholder="john@example.com" required />
                <span className="field-error" aria-live="polite"></span>
              </div>
              <div className="field">
                <label htmlFor="c-company">Company</label>
                <input id="c-company" name="company" type="text" autoComplete="organization" placeholder="Your Organization" />
              </div>
              <div className="field">
                <label htmlFor="c-phone">Phone</label>
                <input id="c-phone" name="phone" type="tel" autoComplete="tel" placeholder="+44 (0) 20 7123 4567" />
              </div>
              <div className="field field--full">
                <label htmlFor="c-service">Service Interest</label>
                <select id="c-service" name="service">
                  <option value="">Select a service area</option>
                  <option>Training &amp; Education</option>
                  <option>Immersive Technology</option>
                  <option>Digital Presence &amp; Development</option>
                  <option>Consulting Services</option>
                  <option>Multiple Services</option>
                  <option>Not Sure Yet</option>
                </select>
              </div>
              <div className="field field--full">
                <label htmlFor="c-message">Tell Us About Your Project *</label>
                <textarea id="c-message" name="message" placeholder="Describe your project requirements, goals, and any specific challenges you're facing..." required></textarea>
                <span className="field-error" aria-live="polite"></span>
              </div>
            </div>
            <button className="btn btn--primary btn--block" type="submit">Send Inquiry <Icon name="arrow" /></button>
          </ValidatedForm>

          <div className="sticky-col" data-stagger="0.1">
            <div className="glass glass--flat" data-reveal>
              <h2 className="h3">Contact Information</h2>
              <ul className="info-list">
                <li><span className="icon-bubble"><Icon name="mail" /></span><div><span>Email</span><a href="mailto:info@maritime.studio">info@maritime.studio</a></div></li>
                <li><span className="icon-bubble"><Icon name="phone" /></span><div><span>Phone</span>—</div></li>
                <li><span className="icon-bubble"><Icon name="pin" /></span><div><span>Location</span>Norway</div></li>
                <li><span className="icon-bubble icon-bubble--warm"><Icon name="clock" /></span><div><span>Response Time</span>Within 24 hours</div></li>
              </ul>
            </div>
            <div className="glass glass--flat" data-reveal style={{ background: 'linear-gradient(150deg,rgba(10,65,116,.6),rgba(25,51,71,.45))', borderColor: 'rgba(123,189,232,.3)' }}>
              <h2 className="h3">Prefer a Quick Call?</h2>
              <p>Schedule a 30-minute discovery call to discuss your project needs and explore how Maritime.Studio can help.</p>
              <a className="btn btn--sand" href="mailto:info@maritime.studio?subject=Schedule%20a%2030-minute%20discovery%20call">Schedule a Call <Icon name="arrow" /></a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
