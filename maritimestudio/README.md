# Maritime.Studio — Liquid UI

Redesign of [maritimestudio.no](https://maritimestudio.no): every page, the 558‑term glossary
and both campaign landing pages.

**Stack:** Next.js 15 (App Router, static export) · React 19 · TypeScript · React Three Fiber
(three.js) · GSAP + ScrollTrigger + Flip · Lenis.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build      # writes a static site to out/
npm start          # serves out/ on http://localhost:3000
```

`out/` is plain HTML/CSS/JS: deploy it to Vercel, Netlify, Cloudflare Pages, GitHub Pages or any
web server. On Vercel you can also deploy the repo directly (framework preset: Next.js, root
directory: `maritimestudio`). URLs match the current site: `/services/`,
`/glossary/cybersecurity/`, `/campaign/mcsa-training-2026/`…

`npm run typecheck` runs the TypeScript compiler.

## Structure

```
app/                     routes (one page.tsx per URL), layout, globals.css, sitemap, robots
  glossary/[category]/   8 glossary categories, generated from data/glossary.json
  blog-post/[slug]/      article pages, generated from lib/site.ts
components/
  Header, Footer, Brand, Icon         shared chrome
  three/Experience                    persistent React Three Fiber scene behind the whole site:
                                      Gerstner-wave ocean to the horizon, liquid-glass drop,
                                      glowing plankton; scroll dives the camera underwater,
                                      page changes make the drop and sea burst
  three/shaders.ts                    GLSL for sea, sky, drop and particles
  LiquidTransition                    GSAP wave between pages (App Router)
  SmoothScroll                        Lenis, synced to GSAP's ticker and ScrollTrigger
  Effects                             GSAP reveals, split headlines, counters, gauge, parallax,
                                      tilt, magnetic buttons, pointer light
  FilterGrid                          chips + GSAP Flip re-layout (case studies, articles)
  GlossarySearch                      live search for the hub and category pages
  ValidatedForm                       contact & brochure forms
  ServiceIndex, Cta, CalmToggle, ResourcesParts, ArticleGrid
lib/      site data (nav, articles), glossary helpers, motion & scroll helpers
data/     glossary.json (558 terms)
```

## Motion and accessibility

- `prefers-reduced-motion` and the footer's **Calm mode** switch turn off Lenis, page waves,
  parallax and reveal animations; the 3D scene stops animating and only follows the scroll.
- Without WebGL the scene is skipped and the dark gradient background remains.
- Skip link, visible focus, real buttons and labels, `aria-current`, `aria-expanded`, keyboard
  menus, focus moves to the new page's heading after each route change.

## Forms

The site is a static export, so there is no backend. By default the contact and brochure forms
validate, then open the visitor's email app with the message filled in. To send to a form
service, pass `endpoint="https://…"` to `<ValidatedForm>` in `app/contact/page.tsx` and
`app/campaign/mcsa-training-2026/page.tsx`.

## To replace

- Logo: `components/Brand.tsx` is an SVG redraw of the current mark in the new palette.
- Brochure PDFs: buttons currently request the brochure by email; put PDFs in `public/` and link them.
- Phone number (empty on the current site), Privacy Policy / Terms (link to `#` as now),
  "Explore Maritime.LMS" (links to Contact).
