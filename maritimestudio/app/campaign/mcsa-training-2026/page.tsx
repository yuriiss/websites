import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { ValidatedForm } from '@/components/ValidatedForm';

export const metadata: Metadata = {
  title: "Maritime Cybersecurity Training 2026 — CPD Programme for Sea, Yard & Shore | Maritime.Studio",
  description: "Three role-specific tracks for seafarers, shipbuilders and office staff — mapped to IMO, USCG 33 CFR 101, IACS UR E26/E27 and EU NIS2. CPD certificate included.",
  alternates: { canonical: '/campaign/mcsa-training-2026/' },
};

export default function McsaTraining2026Page() {
  return (
    <>
      <section className="hero" aria-labelledby="t26-title" style={{ minHeight: 'auto' }}>
        <div className="container">
          <div className="hero-copy" style={{ maxWidth: '940px' }}>
            <span className="eyebrow eyebrow--warm">Comprehensive CPD Programme · 2026</span>
            <h1 className="display" id="t26-title" style={{ fontSize: 'clamp(2.4rem,5.4vw,4.8rem)' }}>
              <span className="split-line"><span>Maritime Cybersecurity</span></span>
              <span className="split-line"><span>Training for <em>Sea, Yard &amp; Shore</em></span></span>
            </h1>
            <p className="lead" data-reveal style={{ '--d': '.45s' }}>One shared core foundation. Three role-specific tracks — Seafarers, Shipbuilders, and Shore-Based Office Personnel — with a curriculum mapped to the subject areas of every major maritime cyber framework in force today.</p>
            <div className="btn-row" data-reveal style={{ '--d': '.6s' }}>
              <a className="btn btn--primary" href="#brochure"><Icon name="download" /> Download the course brochure</a>
              <a className="btn btn--ghost" href="#tracks">Explore the tracks</a>
            </div>
            <div className="chip-row" data-reveal style={{ '--d': '.75s' }}>
              <span className="chip">IMO MSC-FAL.1/Circ.3/Rev.3</span><span className="chip">USCG 33 CFR 101</span><span className="chip">IACS UR E26/E27</span><span className="chip">EU NIS2</span><span className="chip">NIST CSF 2.0</span>
            </div>
          </div>
        </div>
        <div className="wave-edge wave-edge--bottom" aria-hidden="true"><svg viewBox="0 0 2880 80" preserveAspectRatio="none"><path d="M0 46C240 10 480 82 720 46s480-36 720 0 480 36 720 0 480-36 720 0V80H0z"/></svg></div>
      </section>

      <section className="section section--tint section--tight" aria-label="Key figures">
        <div className="container">
          <div className="big-figures" data-stagger="0.08">
            <div className="big-figure" data-reveal><b>85.7%</b><span>of surveyed European maritime academies offer no cybersecurity training component at all</span></div>
            <div className="big-figure" data-reveal><b>12 Jan 2026</b><span>USCG deadline — annual cybersecurity training mandatory on US-flagged vessels and MTSA facilities</span></div>
            <div className="big-figure" data-reveal><b>€10M / 2%</b><span>maximum EU NIS2 penalty for essential entities, with personal liability for management bodies</span></div>
            <div className="big-figure" data-reveal><b>~2030</b><span>earliest expected arrival of the revised STCW Convention — the gap until then is yours to close</span></div>
          </div>
        </div>
      </section>

      <section className="section" id="tracks" aria-labelledby="arch-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <span className="eyebrow">Course Architecture</span>
            <h2 className="h2" id="arch-title">One foundation. Three professional tracks.</h2>
            <p className="lead">Every participant completes a shared 8-hour Core Foundation, then branches into the track built for their role. Depth, exercises and assessment differ by track — the framework mapping stays consistent across all three.</p>
          </div>
          <div className="core" data-reveal>
            <div className="core-badge">8h<small>CORE</small></div>
            <div>
              <h3 className="h3">Core Foundation · 8 hours</h3>
              <p className="muted" style={{ marginTop: '8px' }}>The maritime cyber threat landscape · IMO cyber risk management framework — Govern, Identify, Protect, Detect, Respond, Recover · NIST CSF 2.0 for maritime · cyber risk fundamentals and the CIA methodology.</p>
            </div>
          </div>
          <div className="grid grid-3" data-stagger="0.08">
            <article className="glass glass--lift track" data-reveal>
              <span className="tag">Track A · Seafarers</span>
              <p className="track-who">Deck &amp; engine officers, ratings, masters</p>
              <div className="track-hours">16 hours</div>
              <ul className="tick-list tick-list--bright">
                <li>Shipboard cyber awareness — phishing, social engineering, USB threats</li>
                <li>OT/IT systems &amp; network segmentation onboard</li>
                <li>ECDIS, AIS &amp; GPS vulnerabilities; GNSS spoofing recognition</li>
                <li>Incident detection and first response at sea</li>
                <li>Secure remote access &amp; third-party technician protocols</li>
                <li>Contingency planning and manual operation fallbacks</li>
              </ul>
            </article>
            <article className="glass glass--lift track" data-reveal>
              <span className="tag">Track B · Shipbuilders</span>
              <p className="track-who">Shipyard engineers, designers, system integrators</p>
              <div className="track-hours">20 hours</div>
              <ul className="tick-list tick-list--bright">
                <li>IACS UR E26/E27 and secure-by-design principles</li>
                <li>Security zones and conduit design</li>
                <li>Cybersecurity Design Description (CSDD) documentation</li>
                <li>Supplier security requirements &amp; UR E27 compliance topics</li>
                <li>Commissioning, testing &amp; handover cyber validation</li>
                <li>Supply chain security and vendor risk management</li>
              </ul>
            </article>
            <article className="glass glass--lift track" data-reveal>
              <span className="tag">Track C · Office Staff</span>
              <p className="track-who">CSO, DPA, IT/OT managers, shore personnel</p>
              <div className="track-hours">24 hours</div>
              <ul className="tick-list tick-list--bright">
                <li>Cybersecurity Plan (CSP) development and governance</li>
                <li>Cyber risk assessment and CIA methodology</li>
                <li>USCG 33 CFR 101 and incident reporting</li>
                <li>EU NIS2 compliance and management body liability</li>
                <li>ISO 27001 / NIST CSF 2.0 implementation</li>
                <li>Cyber exercises, drills and tabletop scenarios</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="models-title">
        <div className="container">
          <div className="section-head section-head--center" data-reveal>
            <span className="eyebrow">Choose Your Model</span>
            <h2 className="h2" id="models-title">Three ways to deploy it</h2>
          </div>
          <div className="grid grid-3" data-stagger="0.08">
            <article className="glass glass--lift plan" data-reveal>
              <span className="plan-kicker">SINGLE PURCHASE · INDIVIDUALS</span>
              <h3 className="h3">CPD Certificate</h3>
              <ul className="tick-list tick-list--bright">
                <li>One-time purchase of a single track or the full programme</li>
                <li>Self-paced e-learning with practical assessments</li>
                <li>Digital Maritime.Studio CPD Certificate in Maritime Cybersecurity</li>
                <li>Counts toward your continuing professional development</li>
                <li>Certificate verifiable online through Maritime.Studio</li>
              </ul>
              <a className="btn btn--ghost card-foot" href="#brochure">Get the brochure &amp; pricing</a>
            </article>
            <article className="glass glass--lift plan plan--featured" data-reveal>
              <span className="tag tag--warm plan-flag">Most Popular</span>
              <span className="plan-kicker">PER-SEAT · COMPANIES &amp; TRAINING CENTRES</span>
              <h3 className="h3">License</h3>
              <ul className="tick-list tick-list--bright">
                <li>Seat blocks across all three tracks — assign by role</li>
                <li>Manager dashboard with completion &amp; assessment reporting</li>
                <li>Records to support your internal training documentation</li>
                <li>Annual refresher modules included for active seats</li>
                <li>Volume pricing as fleet size grows</li>
              </ul>
              <a className="btn btn--primary card-foot" href="#brochure">Get the brochure &amp; pricing</a>
            </article>
            <article className="glass glass--lift plan" data-reveal>
              <span className="plan-kicker">ENTERPRISE · YOUR BRAND, YOUR SYSTEMS</span>
              <h3 className="h3">White Label</h3>
              <ul className="tick-list tick-list--bright">
                <li>Full programme delivered under your branding</li>
                <li>Your QSMS/SMS procedures and forms embedded in modules</li>
                <li>Custom assessment scenarios and certificate design</li>
                <li>Optional SCORM hand-off to your own LMS</li>
                <li>Tailored tabletop exercises built on your fleet profile</li>
              </ul>
              <a className="btn btn--ghost card-foot" href="#brochure">Get the brochure &amp; pricing</a>
            </article>
          </div>
          <p className="notice" style={{ marginTop: '24px' }} data-reveal>All three models deliver the same framework-mapped curriculum and assessment standard. All tiers are CPD programmes — not flag-state, class, or STCW-approved training, and not a substitute for statutory certification.</p>
        </div>
      </section>

      <section className="section" id="brochure" aria-labelledby="brochure-title">
        <div className="container split">
          <div className="sticky-col" data-reveal>
            <span className="eyebrow eyebrow--warm">Course Brochure</span>
            <h2 className="h2" id="brochure-title">Get the full course brochure</h2>
            <p className="lead">A six-page overview you can circulate internally — built for training managers, DPAs, and professionals planning their next credential.</p>
            <ul className="tick-list tick-list--bright">
              <li>Full module breakdown for all three tracks and the Core Foundation</li>
              <li>Framework mapping — IMO, USCG, IACS UR E26/E27, EU NIS2, NIST CSF 2.0</li>
              <li>Assessment and certification details per track</li>
              <li>The three deployment models — CPD Certificate, License, White Label</li>
            </ul>
            <p className="muted small">We'll also follow up once with pricing for the tier you select. No mailing-list spam.</p>
          </div>
          <ValidatedForm className="glass glass--flat" subject="Brochure request — Maritime Cybersecurity Training 2026" success="Thank you — the brochure is on its way to your inbox.">
            <h3 className="h3">Download the brochure</h3>
            <p className="form-note">Fields marked * are required.</p>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="b-first">First name *</label>
                <input id="b-first" name="first_name" type="text" autoComplete="given-name" required />
                <span className="field-error" aria-live="polite"></span>
              </div>
              <div className="field">
                <label htmlFor="b-last">Last name *</label>
                <input id="b-last" name="last_name" type="text" autoComplete="family-name" required />
                <span className="field-error" aria-live="polite"></span>
              </div>
              <div className="field field--full">
                <label htmlFor="b-email">Work email *</label>
                <input id="b-email" name="email" type="email" autoComplete="email" required />
                <span className="field-error" aria-live="polite"></span>
              </div>
              <div className="field field--full">
                <label htmlFor="b-company">Company / institution</label>
                <input id="b-company" name="company" type="text" autoComplete="organization" />
              </div>
              <div className="field">
                <label htmlFor="b-role">Your role *</label>
                <select id="b-role" name="role" required>
                  <option value="">Select your role</option>
                  <option>Deck / engine officer or rating</option>
                  <option>Master / senior officer</option>
                  <option>Cadet / maritime student</option>
                  <option>Shipyard engineer / system integrator</option>
                  <option>CSO / DPA / HSEQ</option>
                  <option>IT / OT manager</option>
                  <option>Training manager / MET institution</option>
                  <option>Other</option>
                </select>
                <span className="field-error" aria-live="polite"></span>
              </div>
              <div className="field">
                <label htmlFor="b-interest">I'm interested in *</label>
                <select id="b-interest" name="interest" required>
                  <option value="">Select an option</option>
                  <option>CPD Certificate (individual)</option>
                  <option>License (per-seat)</option>
                  <option>White Label (enterprise)</option>
                  <option>Not sure yet — just the brochure</option>
                </select>
                <span className="field-error" aria-live="polite"></span>
              </div>
            </div>
            <button className="btn btn--primary btn--block" type="submit">Send &amp; download the brochure <Icon name="arrow" /></button>
            <p className="notice"><strong>Certification status.</strong> Maritime.Studio courses are continuing professional development (CPD) programmes. They are not approved by flag administrations, classification societies, or under the STCW Convention, and they do not replace any statutory, flag-state, or class-required training or certification.</p>
          </ValidatedForm>
        </div>
      </section>
    </>
  );
}
