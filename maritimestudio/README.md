# Maritime.Studio — Liquid UI redesign

A complete redesign of [maritimestudio.no](https://maritimestudio.no): every page, the full
558‑term glossary and both campaign landing pages, rebuilt as a fast static site
(HTML + CSS + vanilla JS, no framework, no build step needed to run it).

## Run it

The finished site is in `site/`. Serve that folder with any static server:

```bash
cd site
python3 -m http.server 8080
# open http://localhost:8080
```

Opening `site/index.html` directly from disk also works (links are rewritten to
`index.html`), but liquid page transitions need `http://`, so a local server is recommended.

Deploy: upload the contents of `site/` to any static host (Netlify, Vercel, Cloudflare
Pages, GitHub Pages, nginx). Every page is a folder with `index.html`, so the URLs match
the current site: `/services/`, `/glossary/cybersecurity/`, `/campaign/mcsa-training-2026/`…
`404.html` is used by most hosts automatically.

## Edit it

Page content lives in `src/pages/*.html`; glossary terms in `src/data/glossary.json`;
articles, page titles and meta descriptions in `build.py`. After editing, rebuild:

```bash
python3 build.py   # Python 3.8+, no dependencies
```

`site/assets/css/main.css` and `site/assets/js/main.js` are edited directly.

## What's inside

| Path | Page |
| --- | --- |
| `/` | Home |
| `/services/` | 15 services in 6 blocks (+ Maritime.LMS) |
| `/about/` | Mission, vision, values |
| `/case-studies/` | 4 case studies with filters |
| `/rnd/` | Maritime AI competency |
| `/resources/` | Articles with filters |
| `/blog-post/?post=…` | Article view (falls back to the list) |
| `/blog-editor/` | Admin-only placeholder (as on the current site, `noindex`) |
| `/contact/` | Consultation form |
| `/glossary/` + 8 categories | 558 terms, live search, A–Z jump bar, deep links `#term-id` |
| `/campaign/mcsa-ms-lm/` | Maritime Cyber Security Awareness course |
| `/campaign/mcsa-training-2026/` | Cybersecurity Training 2026 programme + brochure form |

## Liquid UI — how the motion works

- **Page transitions**: internal links are fetched and only `<main>` is swapped, behind a
  two-layer SVG wave that rises and drains. History, back/forward, deep links, focus and
  screen-reader announcements are handled; any failure falls back to normal navigation.
- **Ocean hero**: a small WebGL shader (domain-warped noise in the palette) that ripples
  under the pointer, renders at ~half resolution and pauses off-screen / in background tabs.
  Without WebGL a CSS gradient is shown.
- **Reveal, counters, gauge, liquid nav pill, pointer light on cards, magnetic buttons,
  morphing icon bubbles.**
- **Accessibility**: `prefers-reduced-motion` turns all of this into instant, static states;
  a **Calm mode** toggle in the footer does the same for anyone who wants it (remembered per
  browser). Skip link, visible focus, real buttons/labels, `aria-current`, `aria-expanded`,
  keyboard-operable menus, AA contrast on the dark palette.

## Forms

There is no backend in a static site. By default the contact and brochure forms validate
and then open the visitor's email app with the message pre-filled to `info@maritime.studio`.
To post to a form service (Formspree, Basin, Netlify Forms, your own API) add
`data-endpoint="https://…"` to the `<form>` in `src/pages/contact.html` /
`src/pages/mcsa-training-2026.html` and rebuild.

## To replace

- **Logo**: the header/footer mark is an SVG redraw of the current logo (sail + waves) in the new
  palette — swap `BRAND_MARK` in `build.py` for the final artwork.
- **Brochure PDFs**: the current site generates them in its app; here the buttons send an email
  request. Put the PDFs in `site/assets/docs/` and point the links at them.
- **Phone number** on Contact is empty on the current site too (shown as "—").
- **Privacy Policy / Terms** link to `#`, as on the current site.
- **"Explore Maritime.LMS"** links to Contact (no LMS URL on the current site).
