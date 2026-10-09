// SVG redraw of the Maritime.Studio mark (sail + two swells) in the Liquid UI
// palette. Replace with the final logo artwork when available.
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 42" aria-hidden="true" focusable="false">
      <path d="M2 6 18 40H9z" fill="#4E8EA2" />
      <path d="M46 6 30 40h9z" fill="#4E8EA2" />
      <path className="crest" d="M24 2 38 40H10z" fill="#7BBDE8" />
      <path className="swell" d="M13.5 30q5-3.6 10.5 0t10.5 0" stroke="#061C2C" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path className="swell" d="M16 35.5q4-3 8 0t8 0" stroke="#061C2C" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Maritime.Studio — home">
      <BrandMark />
      <span className="brand-text">
        <span className="brand-name">Maritime.Studio</span>
        <span className="brand-tag">Maritime EdTech Solutions</span>
      </span>
    </a>
  );
}
