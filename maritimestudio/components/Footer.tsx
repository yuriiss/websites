import { Brand } from './Brand';
import { CalmToggle } from './CalmToggle';
import { Icon } from './Icon';
import { CONTACT_EMAIL } from '@/lib/site';

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Services',
    links: [
      ['/services/#training', 'Training & Education'],
      ['/services/#immersive', 'Immersive Technology'],
      ['/services/#digital', 'Digital Presence'],
      ['/services/#consulting', 'Consulting'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['/about/', 'About Us'],
      ['/case-studies/', 'Case Studies'],
      ['/rnd/', 'R&D'],
      ['/contact/', 'Contact'],
    ],
  },
  {
    title: 'Resources',
    links: [
      ['/resources/', 'Articles & Insights'],
      ['/glossary/', 'Maritime Glossary'],
    ],
  },
  {
    title: 'Campaign',
    links: [
      ['/campaign/mcsa-ms-lm/', 'Cyber Security Awareness'],
      ['/campaign/mcsa-training-2026/', 'Cybersecurity Training 2026'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-swell" aria-hidden="true">
        <svg viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path className="s1" d="M0 70C240 30 480 110 720 70s480-40 720 0 480 40 720 0 480-40 720 0V120H0z" />
          <path className="s2" d="M0 86C240 56 480 116 720 86s480-30 720 0 480 30 720 0 480-30 720 0V120H0z" />
        </svg>
      </div>
      <div className="footer-glow" aria-hidden="true" />
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Brand />
            <p>
              Bridging the maritime industry with cutting-edge digital solutions. Your trusted partner for training,
              technology, and transformation.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary btn--sm" href="/contact/">
                Book Consultation <Icon name="arrow" />
              </a>
            </div>
          </div>
          <div className="footer-reach">
            <span className="eyebrow">Get in touch</span>
            <a className="footer-mail" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <ul className="footer-facts">
              <li><Icon name="pin" />Ålesund, Norway</li>
              <li><Icon name="clock" />Response within 24 hours</li>
            </ul>
            <div className="socials">
              <a href="https://www.linkedin.com/company/maritime-studio" target="_blank" rel="noopener" aria-label="Maritime.Studio on LinkedIn"><Icon name="linkedin" /></a>
              <a href="https://www.facebook.com/maritimstudio/" target="_blank" rel="noopener" aria-label="Maritime.Studio on Facebook"><Icon name="facebook" /></a>
              <a href="https://www.youtube.com/@MaritimeStudio" target="_blank" rel="noopener" aria-label="Maritime.Studio on YouTube"><Icon name="youtube" /></a>
            </div>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer">
          {COLUMNS.map((col) => (
            <div className="footer-col" key={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map(([href, label]) => (
                  <li key={href}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Maritime.Studio. All rights reserved.</span>
          <div className="footer-bottom-right">
            <CalmToggle />
            <nav aria-label="Legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
