#!/usr/bin/env python3
"""
Maritime.Studio — static site builder (no dependencies, Python 3.8+).

    python3 build.py

Reads page bodies from src/pages/*.html and glossary terms from
src/data/glossary.json, wraps them in the shared layout (head, header,
mobile menu, transition veil, footer) and writes the finished site to site/.

Shortcodes inside page files:
    {{root}}          relative path to the site root ("", "../", "../../")
    {{icon:name}}     inline SVG icon from the sprite
    {{articles}}      resource article cards
    {{articles_json}} article data for the blog-post view
"""
import html
import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / "src"
OUT = BASE / "site"
SITE_URL = "https://maritimestudio.no"
OG_IMAGE = ("https://media.base44.com/images/public/69cfb6e0e996f314b6bd9acc/"
            "79cb2cdd8_maritimestudio-og-1200x630.png/v1/fill/w_1200,h_630/"
            "79cb2cdd8_maritimestudio-og-1200x630.png")

# --------------------------------------------------------------------------
# Pages: source fragment -> output path, title, description, nav key
# --------------------------------------------------------------------------
PAGES = [
    dict(src="home", out="index.html", page="home",
         title="Maritime.Studio — Maritime EdTech & Digital Solutions",
         desc="Custom LMS platforms, VR/AR safety simulators, cybersecurity training, web development and consulting built for the global maritime industry."),
    dict(src="services", out="services/index.html", page="services",
         title="Maritime Digital Services — LMS, VR/AR, Web Dev & Consulting | Maritime.Studio",
         desc="15 specialised services for the maritime sector: custom LMS, STCW e-learning, VR safety simulators, maritime web development, SEO, and technical consulting."),
    dict(src="about", out="about/index.html", page="about",
         title="About Maritime.Studio — Our Mission, Team & Values",
         desc="Maritime.Studio was founded in Ålesund, Norway to bridge maritime expertise with digital innovation — building safer, smarter and more compliant shipping operations."),
    dict(src="case-studies", out="case-studies/index.html", page="case-studies",
         title="Maritime Digital Transformation Case Studies & Results | Maritime.Studio",
         desc="See how Maritime.Studio has delivered measurable results — custom LMS deployments, VR simulators, port authority web overhauls and ISM compliance audits."),
    dict(src="rnd", out="rnd/index.html", page="rnd",
         title="Maritime AI & R&D — Prompt Engineering & AI Skills Training | Maritime.Studio",
         desc="AI prompt engineering and workforce upskilling tailored to maritime operations — from FMEA automation and technical documentation to hands-on AI training for seafarers."),
    dict(src="resources", out="resources/index.html", page="resources",
         title="Maritime Industry Insights, Guides & Thought Leadership | Maritime.Studio",
         desc="Expert articles on maritime technology, STCW compliance, VR training, decarbonisation, AI, and digital transformation — written for maritime professionals."),
    dict(src="blog-post", out="blog-post/index.html", page="blog-post",
         title="Maritime Industry Insights, Guides & Thought Leadership | Maritime.Studio",
         desc="Expert articles on maritime technology, STCW compliance, VR training, decarbonisation, AI, and digital transformation — written for maritime professionals."),
    dict(src="blog-editor", out="blog-editor/index.html", page="blog-editor", noindex=True,
         title="Blog Editor | Maritime.Studio",
         desc="Blog Editor on Maritime.Studio."),
    dict(src="contact", out="contact/index.html", page="contact",
         title="Contact Maritime.Studio — Book a Free Consultation",
         desc="Get in touch with Maritime.Studio to discuss your maritime digital project. We respond within 24 hours and offer free 30-minute discovery calls."),
    dict(src="mcsa-ms-lm", out="campaign/mcsa-ms-lm/index.html", page="campaign",
         title="Maritime Cyber Security Awareness — Online CPD Course with 5 Simulators | Maritime.Studio",
         desc="IMO MSC.428(98)-aligned online course for seafarers and shore staff: 5 interactive simulators, phishing drills, OT/IT threat modules and a CPD certificate."),
    dict(src="mcsa-training-2026", out="campaign/mcsa-training-2026/index.html", page="campaign",
         title="Maritime Cybersecurity Training 2026 — CPD Programme for Sea, Yard & Shore | Maritime.Studio",
         desc="Three role-specific tracks for seafarers, shipbuilders and office staff — mapped to IMO, USCG 33 CFR 101, IACS UR E26/E27 and EU NIS2. CPD certificate included."),
    dict(src="404", out="404.html", page="404", noindex=True, absolute=True,
         title="Page not found | Maritime.Studio",
         desc="This page has drifted off course."),
]

GLOSSARY_HUB = dict(
    out="glossary/index.html", page="glossary",
    title="Maritime Glossary Hub — 558+ Terms: DP, Alternative Fuels, Cybersecurity, Autonomous Ships & More | Maritime.Studio",
    desc="The maritime industry's reference glossary: 558+ terms across dynamic positioning, alternative fuels, battery energy storage, maritime cybersecurity (325 terms), autonomous vessels, training, vessel operations and regulation. By Maritime.Studio, Ålesund.")

# Short card copy used on the glossary hub (from the current site)
GLOSSARY_CARDS = {
    "dynamic-positioning": "DP class, FMEA, ASOG, CAMO, capability plots, drive-off, drift-off, thruster allocation, position reference systems and more.",
    "alternative-fuels": "LNG, methanol, ammonia and hydrogen as fuel, FuelEU Maritime, EU ETS, CII, EEDI/EEXI, IGF Code, methane slip and more.",
    "energy-storage": "Energy storage systems, battery management, thermal runaway, state of charge, spinning reserve, DC grids and more.",
    "cybersecurity": "IMO MSC.428(98), IACS UR E26/E27, USCG cyber rule, SBOM, OT security, threats, defences, governance — 300+ terms.",
    "autonomous-vessels": "MASS, IMO MASS Code, autonomy degrees, remote operations centres, sensor fusion, collision avoidance, ODD and more.",
    "regulations-class": "IMO conventions, SOLAS, MARPOL, ISM and ISPS Codes, classification societies, flag and port state control and more.",
    "training-certification": "STCW, Certificate of Competency, DPO certification, CPD, simulator training, e-learning, competence assessment and more.",
    "vessel-operations": "Passage planning, under-keel clearance, tonnage, offshore vessel types (PSV, AHTS, MODU), pilotage, VTS and more.",
}
GLOSSARY_ICONS = {
    "dynamic-positioning": "target", "alternative-fuels": "drop", "energy-storage": "battery",
    "cybersecurity": "shield", "autonomous-vessels": "radar", "regulations-class": "scale",
    "training-certification": "cap", "vessel-operations": "anchor",
}

ARTICLES = [
    dict(slug="vr-crew-safety", cat="Technology", date="Mar 20, 2026",
         title="The Future of Maritime Training: How VR is Transforming Crew Safety",
         excerpt="Virtual reality is reshaping how maritime crews prepare for emergency scenarios. We explore the latest developments and ROI data from leading shipping companies."),
    dict(slug="stcw-2025-updates", cat="Safety & Compliance", date="Mar 10, 2026",
         title="STCW 2025 Updates: What Training Providers Need to Know",
         excerpt="The latest STCW amendments bring significant changes to certification requirements. Here's our comprehensive breakdown of what's changing and how to prepare."),
    dict(slug="maritime-seo-strategies", cat="Digital Marketing", date="Feb 28, 2026",
         title="5 SEO Strategies That Actually Work for Maritime Companies",
         excerpt="Maritime SEO requires a specialized approach. We share the strategies that have consistently doubled qualified leads for our maritime clients."),
    dict(slug="digital-first-training-program", cat="Training", date="Feb 15, 2026",
         title="Building a Digital-First Maritime Training Program: A Step-by-Step Guide",
         excerpt="A comprehensive guide to transitioning from traditional classroom training to a modern, digital-first approach without losing effectiveness."),
    dict(slug="imo-2030-decarbonization", cat="Industry Insights", date="Feb 1, 2026",
         title="IMO 2030: How Digital Transformation Supports Decarbonization Goals",
         excerpt="Exploring the role of digital technology in helping the maritime industry meet its ambitious environmental targets."),
    dict(slug="marine-software-ux", cat="Technology", date="Jan 20, 2026",
         title="Designing Marine Software UX for High-Stress Environments",
         excerpt="Key principles for designing user interfaces that perform reliably when crews are under pressure — lessons from real bridge and engine room software."),
]

# --------------------------------------------------------------------------
# Icon sprite (24px, 1.6 stroke)
# --------------------------------------------------------------------------
ICONS = {
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "chev": '<path d="m6 9 6 6 6-6"/>',
    "cap": '<path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.5v4.5c3.2 2.2 8.8 2.2 12 0v-4.5M22 9.5v5"/>',
    "vr": '<rect x="2" y="7" width="20" height="11" rx="4"/><circle cx="8" cy="12.5" r="2"/><circle cx="16" cy="12.5" r="2"/><path d="M10 12.5h4"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.4 3.2 14.6 0 18M12 3c-3.2 3.4-3.2 14.6 0 18"/>',
    "compass": '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    "pen": '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    "layers": '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    "anchor": '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 12H3a9 9 0 0 0 18 0h-2M8 10h8"/>',
    "chip": '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M10 10h4v4h-4z"/>',
    "shield": '<path d="M12 3 4 6v6c0 4.5 3.3 8 8 9 4.7-1 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
    "pin": '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "phone": '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    "linkedin": '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
    "facebook": '<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h2.5l.5-4h-3V7a1 1 0 0 1 1-1h1z"/>',
    "youtube": '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    "quote": '<path d="M9 7H5v6h4v4H5M19 7h-4v6h4v4h-4" />',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    "alert": '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>',
    "check": '<path d="m5 12 5 5L20 7"/>',
    "download": '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    "star": '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    "drop": '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
    "battery": '<rect x="2" y="7" width="17" height="10" rx="2.5"/><path d="M22 10.5v3M9 9l-2 3h4l-2 3"/>',
    "radar": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18 6"/>',
    "scale": '<path d="M12 4v16M7 20h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    "wave": '<path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1"/><path d="M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1"/>',
    "spark": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    "doc": '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    "news": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h6M7 13h10M7 16h10"/>',
    "image": '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    "code": '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
    "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "lock": '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    "monitor": '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    "fish": '<path d="M3 12c4-6 11-6 15 0-4 6-11 6-15 0z"/><path d="M18 12l3-3v6z"/>',
    "ship": '<path d="M3 16l2 4h14l2-4H3z"/><path d="M6 16V9h12v7M12 9V4M9 6h6"/>',
    "gauge": '<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/>',
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    "book": '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3"/><path d="M20 4v14h-7"/>',
}


def icon(name, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


def sprite():
    syms = "".join(
        f'<symbol id="i-{k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        f'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{v}</symbol>'
        for k, v in ICONS.items())
    return f'<svg width="0" height="0" style="position:absolute" aria-hidden="true">{syms}</svg>'


BRAND_MARK = (
    '<svg class="brand-mark" viewBox="0 0 48 42" aria-hidden="true" focusable="false">'
    '<path d="M2 6 18 40H9z" fill="#4E8EA2"/><path d="M46 6 30 40h9z" fill="#4E8EA2"/>'
    '<path class="crest" d="M24 2 38 40H10z" fill="#7BBDE8"/>'
    '<path class="swell" d="M13.5 30q5-3.6 10.5 0t10.5 0" stroke="#061C2C" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    '<path class="swell" d="M16 35.5q4-3 8 0t8 0" stroke="#061C2C" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    '</svg>')


def brand(r):
    return (f'<a class="brand" href="{r}" aria-label="Maritime.Studio — home">{BRAND_MARK}'
            '<span class="brand-text"><span class="brand-name">Maritime.Studio</span>'
            '<span class="brand-tag">Maritime EdTech Solutions</span></span></a>')


# --------------------------------------------------------------------------
# Layout
# --------------------------------------------------------------------------
def header(r):
    def link(href, label, extra=""):
        return f'<a class="nav-link" href="{r}{href}" data-nav-link{extra}>{label}</a>'

    def menu(id_, label, items):
        links = "".join(
            f'<a href="{r}{h}" data-nav-link{" data-prefix" if pre else ""}>{t}<span>{s}</span></a>'
            for h, t, s, pre in items)
        return (f'<div class="nav-item" data-has-menu>'
                f'<button class="nav-link" type="button" aria-expanded="false" aria-controls="{id_}">{label}{icon("chev", "chev")}</button>'
                f'<div class="dropdown" id="{id_}">{links}</div></div>')

    resources = [("resources/", "Articles &amp; Insights", "Guides and thought leadership", False),
                 ("glossary/", "Maritime Glossary", "558+ terms explained", True)]
    campaign = [("campaign/mcsa-ms-lm/", "Cyber Security Awareness", "Online CPD course · 5 simulators", False),
                ("campaign/mcsa-training-2026/", "Cybersecurity Training 2026", "Sea, yard &amp; shore tracks", False)]

    nav = (
        '<nav class="nav" aria-label="Main">'
        '<span class="nav-blob" aria-hidden="true"></span>'
        f'<div class="nav-item">{link("", "Home", " data-home")}</div>'
        f'<div class="nav-item">{link("services/", "Services")}</div>'
        f'<div class="nav-item">{link("about/", "About")}</div>'
        f'<div class="nav-item">{link("case-studies/", "Case Studies")}</div>'
        f'<div class="nav-item">{link("rnd/", "R&amp;D")}</div>'
        f'{menu("menu-resources", "Resources", resources)}'
        f'<div class="nav-item">{link("contact/", "Contact")}</div>'
        f'{menu("menu-campaign", "Campaign", campaign)}'
        '</nav>')

    mm_links = "".join([
        f'<a href="{r}" data-nav-link data-home>Home</a>',
        f'<a href="{r}services/" data-nav-link>Services</a>',
        f'<a href="{r}about/" data-nav-link>About</a>',
        f'<a href="{r}case-studies/" data-nav-link>Case Studies</a>',
        f'<a href="{r}rnd/" data-nav-link>R&amp;D</a>',
        f'<a href="{r}contact/" data-nav-link>Contact</a>',
    ])
    mm_sub = lambda label, items: (f'<p class="mm-label">{label}</p><div class="sub">' + "".join(
        f'<a href="{r}{h}" data-nav-link{" data-prefix" if pre else ""}>{t}</a>' for h, t, s, pre in items) + '</div>')

    return f'''<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container header-inner">
    {brand(r)}
    {nav}
    <a class="btn btn--primary btn--sm header-cta" href="{r}contact/">Book Consultation</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav aria-label="Mobile">
    {mm_links}
    {mm_sub("Resources", resources)}
    {mm_sub("Campaign", campaign)}
  </nav>
  <a class="btn btn--primary" href="{r}contact/">Book Consultation {icon("arrow")}</a>
</div>'''


def footer(r):
    return f'''<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        {brand(r)}
        <p>Bridging the maritime industry with cutting-edge digital solutions. Your trusted partner for training, technology, and transformation.</p>
        <div class="socials">
          <a href="https://www.linkedin.com/company/maritime-studio" target="_blank" rel="noopener" aria-label="Maritime.Studio on LinkedIn">{icon("linkedin")}</a>
          <a href="https://www.facebook.com/maritimstudio/" target="_blank" rel="noopener" aria-label="Maritime.Studio on Facebook">{icon("facebook")}</a>
          <a href="https://www.youtube.com/@MaritimeStudio" target="_blank" rel="noopener" aria-label="Maritime.Studio on YouTube">{icon("youtube")}</a>
        </div>
      </div>
      <div class="footer-col">
        <h2>Services</h2>
        <a href="{r}services/#training">Training &amp; Education</a>
        <a href="{r}services/#immersive">Immersive Technology</a>
        <a href="{r}services/#digital">Digital Presence</a>
        <a href="{r}services/#consulting">Consulting</a>
      </div>
      <div class="footer-col">
        <h2>Company</h2>
        <a href="{r}about/">About Us</a>
        <a href="{r}case-studies/">Case Studies</a>
        <a href="{r}resources/">Resources</a>
        <a href="{r}contact/">Contact</a>
      </div>
      <div class="footer-col">
        <h2>Get in touch</h2>
        <a class="footer-contact" href="mailto:info@maritime.studio">{icon("mail")}info@maritime.studio</a>
        <span class="footer-contact">{icon("pin")}Norway</span>
        <button class="calm-toggle" type="button" data-calm-toggle aria-pressed="false">{icon("wave")}<span data-calm-label>Calm mode: off</span></button>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> Maritime.Studio. All rights reserved.</span>
      <nav aria-label="Legal"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></nav>
    </div>
    <div class="footer-word" aria-hidden="true">Maritime.Studio</div>
  </div>
</footer>'''


def layout(body, p, r, canonical_path):
    robots = "noindex, nofollow" if p.get("noindex") else "index, follow"
    title = html.escape(p["title"], quote=False)
    desc = html.escape(p["desc"])
    canonical = SITE_URL + "/" + canonical_path
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#061C2C">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Maritime.Studio">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{OG_IMAGE}">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@MaritimeStudio">
<link rel="icon" href="{r}assets/img/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="{r}manifest.json">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&amp;family=JetBrains+Mono:wght@400;500&amp;family=Manrope:wght@400;500;600;700&amp;display=swap">
<link rel="stylesheet" href="{r}assets/css/main.css">
<script defer src="{r}assets/js/main.js"></script>
</head>
<body data-page="{p["page"]}">
{sprite()}
{header(r)}
<main id="main" tabindex="-1">
{body}
</main>
{footer(r)}
<svg class="veil" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="veil-grad-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7BBDE8"/><stop offset=".5" stop-color="#4E8EA2"/><stop offset="1" stop-color="#0A4174"/></linearGradient>
    <linearGradient id="veil-grad-b" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#04141F"/><stop offset="1" stop-color="#0A2338"/></linearGradient>
  </defs>
  <path class="veil-a" fill="url(#veil-grad-a)" d=""/>
  <path class="veil-b" fill="url(#veil-grad-b)" d=""/>
</svg>
<div id="route-status" class="visually-hidden" aria-live="polite"></div>
</body>
</html>
'''


# --------------------------------------------------------------------------
# Generated content
# --------------------------------------------------------------------------
def article_cards(r):
    out = []
    for a in ARTICLES:
        out.append(f'''<a class="glass" href="{r}blog-post/?post={a["slug"]}" data-filter-item data-cat="{html.escape(a["cat"])}" data-reveal>
  <span class="tag">{html.escape(a["cat"])}</span>
  <h3 class="h3">{html.escape(a["title"])}</h3>
  <p>{html.escape(a["excerpt"])}</p>
  <div class="meta-row"><span>Maritime.Studio Team</span><span>{a["date"]}</span></div>
</a>''')
    return "\n".join(out)


def articles_json():
    data = [dict(a, author="Maritime.Studio Team") for a in ARTICLES]
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def first_letter(term):
    ch = term.strip()[0].upper()
    return ch if ch.isalnum() else "#"


def ocean(intensity="1", soft=False):
    cls = "ocean ocean--soft" if soft else "ocean"
    return f'<div class="{cls}" data-intensity="{intensity}" aria-hidden="true"></div>'


def glossary_hub(data, r):
    cats = data["categories"]
    total = sum(len(c["terms"]) for c in cats)
    cards = []
    for i, c in enumerate(cats):
        cards.append(f'''<a class="glass cat-card" href="{r}glossary/{c["slug"]}/" data-reveal>
  <span class="icon-bubble">{icon(GLOSSARY_ICONS.get(c["slug"], "book"))}</span>
  <h3 class="h3">{html.escape(c["name"])}</h3>
  <span class="count">{len(c["terms"])} terms</span>
  <p>{html.escape(GLOSSARY_CARDS.get(c["slug"], ""))}</p>
  <span class="link-arrow card-foot">Browse {html.escape(c["name"])} {icon("arrow")}</span>
</a>''')
    # A–Z list in the order the current site shows it: by first character, then by category order
    groups = {}
    for c in cats:
        for t in c["terms"]:
            groups.setdefault(first_letter(t["term"]), []).append((t, c))
    order = sorted(groups.keys(), key=lambda k: (not k.isdigit(), k))
    az = []
    for k in order:
        items = "".join(
            f'<li><a href="{r}glossary/{c["slug"]}/#{t["id"]}">{html.escape(t["term"])}<small>{html.escape(t["tag"])}</small></a></li>'
            for t, c in groups[k])
        az.append(f'<div class="az-group"><h3>{k}</h3><ul>{items}</ul></div>')

    return f'''<section class="page-hero">
  {ocean("0.9", soft=True)}
  <div class="container">
    <span class="eyebrow">Maritime Glossary · {total} terms</span>
    <h1 class="h1"><span class="split-line"><span>The Maritime</span></span><span class="split-line"><span><em>Glossary</em></span></span></h1>
    <p class="lead">558+ maritime terms explained in plain language — from dynamic positioning and FMEA to alternative fuels, battery energy storage, maritime cybersecurity, autonomous vessels, training, operations and regulation. Built and maintained by Maritime.Studio, a maritime EdTech and consulting partner in Ålesund, Norway.</p>
  </div>
</section>
<section class="section section--tight">
  <div class="container">
    <div class="grid grid-4" data-stagger="0.06">
      {"".join(cards)}
    </div>
  </div>
</section>
<section class="section section--tint">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Index</span>
      <h2 class="h2">All terms A–Z</h2>
    </div>
    <div class="search" role="search">
      {icon("search")}
      <label class="visually-hidden" for="hub-search">Search all glossary terms</label>
      <input id="hub-search" type="search" placeholder="Search {total} terms — e.g. drive-off, ammonia, IEC 62443" autocomplete="off" data-gloss-search="hub">
    </div>
    <p class="search-count" data-gloss-count aria-live="polite"></p>
    <div class="az" style="margin-top:28px">
      {"".join(az)}
    </div>
    <p class="empty-state">No terms match your search. Try a shorter word or an abbreviation.</p>
  </div>
</section>
{glossary_cta(r)}'''


def glossary_cta(r):
    return f'''<section class="section">
  <div class="container">
    <div class="cta" data-reveal>
      <span class="cta-blob cta-blob--a" aria-hidden="true"></span><span class="cta-blob cta-blob--b" aria-hidden="true"></span>
      <h2 class="h2">Put these terms into practice</h2>
      <p class="lead">Maritime.Studio delivers online training for maritime officers and DPOs, plus specialist consulting in dynamic positioning and FMEA. If a definition raised a question about your vessel or your crew's competence, we can help.</p>
      <div class="btn-row"><a class="btn btn--sand" href="{r}services/">Explore our services {icon("arrow")}</a></div>
    </div>
  </div>
</section>'''


def glossary_category(data, c, r):
    tabs = "".join(
        f'<a href="{r}glossary/{x["slug"]}/"{" aria-current=\"page\"" if x["slug"] == c["slug"] else ""}>{html.escape(x["name"])}</a>'
        for x in data["categories"])
    groups = {}
    for t in c["terms"]:
        groups.setdefault(first_letter(t["term"]), []).append(t)
    keys = list(groups.keys())  # keep the site's order (already alphabetical)
    letters = "".join(f'<a href="#letter-{k}">{k}</a>' for k in keys)
    blocks = []
    for k in keys:
        terms = "".join(f'''<div class="term" id="{t["id"]}">
  <dt><a class="anchor" href="#{t["id"]}"><strong>{html.escape(t["term"])}</strong></a><span class="tag tag--warm">{html.escape(t["tag"])}</span></dt>
  <dd>{html.escape(t["def"])}</dd>
</div>''' for t in groups[k])
        blocks.append(f'<section class="term-group" id="letter-{k}" aria-labelledby="h-letter-{k}"><h2 class="term-letter" id="h-letter-{k}">{k}</h2><dl class="terms">{terms}</dl></section>')

    return f'''<section class="page-hero">
  {ocean("0.8", soft=True)}
  <div class="container">
    <a class="link-arrow" href="{r}glossary/" style="flex-direction:row-reverse;justify-content:flex-end"><span>All categories</span>{icon("arrow")}</a>
    <span class="eyebrow">Glossary · {len(c["terms"])} terms</span>
    <h1 class="h1"><span class="split-line"><span>{html.escape(c["name"])}</span></span></h1>
    <p class="lead">{html.escape(c["intro"])}</p>
  </div>
</section>
<section class="section section--tight" style="padding-top:0">
  <div class="container">
    <nav class="cat-tabs" aria-label="Glossary categories" style="margin-bottom:24px">{tabs}</nav>
    <div class="search" role="search" style="margin-bottom:8px">
      {icon("search")}
      <label class="visually-hidden" for="term-search">Search {html.escape(c["name"])} terms</label>
      <input id="term-search" type="search" placeholder="Filter {len(c["terms"])} terms and definitions" autocomplete="off" data-gloss-search="terms">
    </div>
    <p class="search-count" data-gloss-count aria-live="polite"></p>
    <nav class="letters" aria-label="Jump to letter">{letters}</nav>
    {"".join(blocks)}
    <p class="empty-state">No terms match your search in this category. <a href="{r}glossary/">Search the whole glossary</a>.</p>
  </div>
</section>
{glossary_cta(r)}'''


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------
def rel_root(out_path, absolute=False):
    if absolute:
        return "/"
    depth = out_path.count("/")
    return "../" * depth


def render(fragment, r):
    fragment = fragment.replace("{{articles}}", article_cards(r))
    fragment = fragment.replace("{{articles_json}}", articles_json())
    fragment = re.sub(r"\{\{icon:([a-z0-9-]+)\}\}", lambda m: icon(m.group(1)), fragment)
    fragment = re.sub(r"\{\{ocean(?::([0-9.]+))?\}\}", lambda m: ocean(m.group(1) or "1"), fragment)
    fragment = re.sub(r"\{\{ocean-soft(?::([0-9.]+))?\}\}", lambda m: ocean(m.group(1) or "0.85", soft=True), fragment)
    return fragment.replace("{{root}}", r)


def canonical_of(out):
    if out == "index.html":
        return ""
    return out.replace("index.html", "")


def write(out, text):
    path = OUT / out
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def main():
    written = []
    for p in PAGES:
        r = rel_root(p["out"], p.get("absolute"))
        body = render((SRC / "pages" / f'{p["src"]}.html').read_text(encoding="utf-8"), r)
        write(p["out"], layout(body, p, r, canonical_of(p["out"])))
        written.append(p["out"])

    data = json.loads((SRC / "data" / "glossary.json").read_text(encoding="utf-8"))
    r = rel_root(GLOSSARY_HUB["out"])
    write(GLOSSARY_HUB["out"], layout(glossary_hub(data, r), GLOSSARY_HUB, r, canonical_of(GLOSSARY_HUB["out"])))
    written.append(GLOSSARY_HUB["out"])
    for c in data["categories"]:
        out = f'glossary/{c["slug"]}/index.html'
        r = rel_root(out)
        meta = dict(page="glossary", title=c["title"], desc=c["desc"])
        write(out, layout(glossary_category(data, c, r), meta, r, canonical_of(out)))
        written.append(out)

    # sitemap
    urls = "".join(
        f"<url><loc>{SITE_URL}/{canonical_of(o)}</loc></url>"
        for o in written if o not in ("404.html", "blog-editor/index.html"))
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    print(f"Built {len(written)} pages into {OUT}")


if __name__ == "__main__":
    main()
