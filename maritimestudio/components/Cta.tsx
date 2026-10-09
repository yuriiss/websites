import type { ReactNode } from 'react';

// Closing call-to-action band with two slow morphing light blobs.
export function Cta({ id, title, lead, children, bare = false }: { id: string; title: string; lead?: string; children: ReactNode; bare?: boolean }) {
  const band = (
    <div className="cta" data-reveal>
      <span className="cta-blob cta-blob--a" aria-hidden="true" />
      <span className="cta-blob cta-blob--b" aria-hidden="true" />
      <h2 className="h2" id={id}>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
      <div className="btn-row" style={{ justifyContent: 'center' }}>{children}</div>
    </div>
  );
  if (bare) return band;
  return (
    <section className="section" aria-labelledby={id}>
      <div className="container">{band}</div>
    </section>
  );
}
