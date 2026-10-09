import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { Ocean } from '@/components/Ocean';

export const metadata: Metadata = {
  title: "Maritime Cyber Security Awareness — Online CPD Course with 5 Simulators | Maritime.Studio",
  description: "IMO MSC.428(98)-aligned online course for seafarers and shore staff: 5 interactive simulators, phishing drills, OT/IT threat modules and a CPD certificate.",
  alternates: { canonical: '/campaign/mcsa-ms-lm/' },
};

export default function McsaMsLmPage() {
  return (
    <>
      <section className="hero" aria-labelledby="mcsa-title" style={{ minHeight: 'auto' }}>
        <Ocean intensity={0.95} />
        <div className="container">
          <div className="hero-copy" style={{ maxWidth: '900px' }}>
            <span className="eyebrow eyebrow--warm">Online CPD Course · 5 Interactive Simulators · CPD Certificate Included</span>
            <h1 className="display" id="mcsa-title" style={{ fontSize: 'clamp(2.5rem,5.6vw,5rem)' }}>
              <span className="split-line"><span>Maritime Cyber</span></span>
              <span className="split-line"><span><em>Security Awareness</em></span></span>
            </h1>
            <p className="lead" data-reveal style={{ '--d': '.45s' }}>Practical cybersecurity competence for seafarers and shore staff — aligned with IMO MSC.428(98), the ISM Code, IACS UR E26/E27 and the USCG Final Rule. A Maritime.Studio course, delivered on the Learnmarine platform.</p>
            <div className="btn-row" data-reveal style={{ '--d': '.6s' }}>
              <a className="btn btn--primary" href="https://learnmarine.com/catalogue/maritime-cyber-security-awareness" target="_blank" rel="noopener">Enrol on Learnmarine <Icon name="arrow" /></a>
              <a className="btn btn--ghost" href="mailto:info@maritime.studio?subject=Brochure%20request%3A%20Maritime%20Cyber%20Security%20Awareness"><Icon name="download" /> Download the brochure (PDF)</a>
            </div>
            <p className="alert-band" data-reveal style={{ '--d': '.75s' }}><Icon name="alert" /><span>USCG cybersecurity training mandate in force since 12 January 2026 — is your crew covered?</span></p>
          </div>
        </div>
        <div className="wave-edge wave-edge--bottom" aria-hidden="true"><svg viewBox="0 0 2880 80" preserveAspectRatio="none"><path d="M0 46C240 10 480 82 720 46s480-36 720 0 480 36 720 0 480-36 720 0V80H0z"/></svg></div>
      </section>

      <section className="section section--tint section--tight" aria-label="Key figures">
        <div className="container">
          <div className="big-figures" data-stagger="0.08">
            <div className="big-figure" data-reveal><b><span data-count="87" data-suffix="%">87%</span></b><span>of maritime companies hit by a cyber-attack in a single year (Lloyd's Register)</span></div>
            <div className="big-figure" data-reveal><b>2 / 35</b><span>European MET institutions teach ship-officer-specific cybersecurity</span></div>
            <div className="big-figure" data-reveal><b>12 Jan 2026</b><span>USCG deadline: mandatory cyber training for all personnel with IT/OT access</span></div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="learn-title">
        <div className="container split">
          <div className="sticky-col" data-reveal>
            <span className="eyebrow">Curriculum</span>
            <h2 className="h2" id="learn-title">What you will learn</h2>
          </div>
          <div className="mosaic" data-stagger="0.06">
            <div data-reveal><span className="icon-bubble"><Icon name="radar" /></span><p><strong className="h4" style={{ color: 'var(--white)' }}>Maritime cybersecurity risks</strong> — threat actors, attack stages, IT vs OT, and the systems most exposed: ECDIS, AIS, GMDSS, satcom, BWMS.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="scale" /></span><p><strong className="h4" style={{ color: 'var(--white)' }}>Regulatory &amp; compliance requirements</strong> — IMO MSC.428(98), ISM Code, IACS UR E26/E27, USCG 33 CFR Part 101 Subpart F, maritime GDPR.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="doc" /></span><p><strong className="h4" style={{ color: 'var(--white)' }}>The Cyber Security Plan</strong> — governance, asset inventory, risk assessment, the CySO role, drills and renewal cycles.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="lock" /></span><p><strong className="h4" style={{ color: 'var(--white)' }}>Cybersecurity practices</strong> — passwords and MFA, phishing defence, removable media control, 3-2-1 backups, IoT hardening.</p></div>
            <div data-reveal><span className="icon-bubble icon-bubble--warm"><Icon name="alert" /></span><p><strong className="h4" style={{ color: 'var(--white)' }}>Incident reporting</strong> — reportable thresholds, the National Response Center protocol, the office/ship reporting chain.</p></div>
            <div data-reveal><span className="icon-bubble"><Icon name="layers" /></span><p><strong className="h4" style={{ color: 'var(--white)' }}>Three structured modules</strong> — Foundations · Cyber Risks &amp; Protection · Governance, Compliance &amp; Implementation.</p></div>
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="sim-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <span className="eyebrow">Simulators</span>
            <h2 className="h2" id="sim-title">Train by doing — 5 interactive simulators</h2>
          </div>
          <div className="grid grid-3" data-stagger="0.07">
            <article className="glass glass--lift sim-card" data-reveal><span className="tag">IT / OT Attack Vectors</span><h3 className="h3">CS Attack Simulator</h3><p>Launch phishing, infected-USB and GPS-spoofing attacks against a virtual vessel and watch them propagate across IT and OT zones — and learn why segmentation is the last line of defence.</p></article>
            <article className="glass glass--lift sim-card" data-reveal><span className="tag">Bridge Team Resilience</span><h3 className="h3">NAVI Cyber Attack Simulator</h3><p>Con a vessel through the Dover Strait on a live ECDIS/radar overlay while GNSS creeping spoofs, ECDIS kernel attacks and alarm flooding hit the bridge. Initiate manual fallback and keep her safe.</p></article>
            <article className="glass glass--lift sim-card" data-reveal><span className="tag">OT Isolation Drill</span><h3 className="h3">OT Cyber Attack Simulator</h3><p>An attacker executes remote commands on the ballast water management system. Acknowledge, switch to LOCAL/MANUAL, cut the WAN uplink — in the right order, under pressure.</p></article>
            <article className="glass glass--lift sim-card" data-reveal><span className="tag">Human-Factor Drill</span><h3 className="h3">Phishing Simulator</h3><p>A convincing "Port State Control" email threatens fines and detention. Find every red flag before the attachment runs — the exact pattern that compromises real vessels.</p></article>
            <article className="glass glass--lift sim-card" data-reveal><span className="tag tag--warm">IMO &amp; IACS Compliant Audit</span><h3 className="h3">SentinelGuard Simulator</h3><p>Run drills, manage incidents, maintain the asset inventory and complete an IMO 2021 / IACS UR E26-E27 audit checklist for MV Sentinel-Alpha — with a live security-posture score.</p></article>
            <article className="glass glass--flat" data-reveal style={{ background: 'linear-gradient(150deg,rgba(10,65,116,.55),rgba(25,51,71,.4))', borderColor: 'rgba(123,189,232,.3)' }}><span className="icon-bubble"><Icon name="monitor" /></span><h3 className="h3">No installation required</h3><p>All simulators run in the browser, inside the course on the Learnmarine platform — desktop and tablet ready.</p></article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="fw-title">
        <div className="container split">
          <div className="sticky-col" data-reveal>
            <span className="eyebrow">Frameworks</span>
            <h2 className="h2" id="fw-title">Aligned with industry frameworks</h2>
          </div>
          <div className="glass glass--flat" data-reveal>
            <ul className="tick-list tick-list--bright" style={{ gap: '14px' }}>
              <li>IMO Resolution MSC.428(98) — cyber risk management in the SMS</li>
              <li>ISM Code (SOLAS Chapter IX) — documented procedures and audits</li>
              <li>IACS UR E26 &amp; E27 — cyber resilience of ships and onboard systems</li>
              <li>USCG Final Rule 33 CFR Part 101 Subpart F — training, drills, CySO, incident reporting</li>
              <li>NIST Cybersecurity Framework &amp; IMO MSC-FAL.1/Circ.3</li>
              <li>Supports a company's wider cyber training programme</li>
            </ul>
            <p className="notice">Maritime Cyber Security Awareness is a <strong>CPD (Continuing Professional Development)</strong> course. It is not approved or certified by any flag state administration, classification society, or under the STCW Convention, and does not replace any statutory training requirement.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '0' }} aria-labelledby="mcsa-cta">
        <div className="container">
          <div className="cta" data-reveal>
            <span className="cta-blob cta-blob--a" aria-hidden="true"></span><span className="cta-blob cta-blob--b" aria-hidden="true"></span>
            <h2 className="h2" id="mcsa-cta">Make your crew the strongest firewall on board</h2>
            <p className="lead">Enrol today on the Learnmarine platform — narrated modules, knowledge checks, five interactive simulators and a CPD certificate of completion.</p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <a className="btn btn--sand" href="https://learnmarine.com/catalogue/maritime-cyber-security-awareness" target="_blank" rel="noopener">Enrol on Learnmarine <Icon name="arrow" /></a>
              <a className="btn btn--ghost" href="mailto:info@maritime.studio?subject=Brochure%20request%3A%20Maritime%20Cyber%20Security%20Awareness">Download the brochure (PDF)</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
