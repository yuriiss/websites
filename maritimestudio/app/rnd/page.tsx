import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { Ocean } from '@/components/Ocean';

export const metadata: Metadata = {
  title: "Maritime AI & R&D — Prompt Engineering & AI Skills Training | Maritime.Studio",
  description: "AI prompt engineering and workforce upskilling tailored to maritime operations — from FMEA automation and technical documentation to hands-on AI training for seafarers.",
  alternates: { canonical: '/rnd/' },
};

export default function RndPage() {
  return (
    <>
      <section className="page-hero">
        <Ocean soft />
        <div className="container">
          <span className="eyebrow">R&amp;D — Next-Generation Digital Fleet</span>
          <h1 className="h1"><span className="split-line"><span>Maritime</span></span><span className="split-line"><span><em>AI Competency</em></span></span></h1>
          <p className="lead" data-reveal style={{ '--d': '.4s' }}>The maritime industry runs on complex documentation, specialized knowledge, and strict compliance. Our AI services translate that complexity into operational efficiency — automating critical workflows and upskilling your workforce for the AI era.</p>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="ai-int">
        <div className="container split">
          <div className="sticky-col" data-reveal>
            <div className="glass glass--flat" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="media" style={{ margin: '0', borderRadius: '0' }}><img src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&amp;q=80" alt="AI Prompt Engineering for Maritime Operations" width="800" height="450" loading="lazy" decoding="async" /></div>
            </div>
            <span className="eyebrow">AI Integration</span>
            <h2 className="h2" id="ai-int">AI Prompt Engineering for Maritime Operations</h2>
            <p className="lead">Crafting highly optimized, specialized prompts and automated workflows using advanced AI models specifically tuned for the maritime and offshore sectors. We turn complex operational knowledge into efficient, repeatable AI-powered processes.</p>
            <div className="btn-row"><a className="btn btn--primary" href="/contact/">Discuss Your Project <Icon name="arrow" /></a></div>
          </div>
          <div className="grid" data-stagger="0.07">
            <article className="glass glass--lift" data-reveal><span className="icon-bubble"><Icon name="doc" /></span><h3 className="h3">Technical Documentation Automation</h3><p>Automate the generation of complex technical manuals, safety procedures, and operational documentation — ensuring consistency and dramatically reducing authoring time.</p></article>
            <article className="glass glass--lift" data-reveal><span className="icon-bubble"><Icon name="gauge" /></span><h3 className="h3">Technical Reports &amp; FMEA Analysis</h3><p>Streamline the drafting of technical reports and Failure Mode and Effects Analysis using AI workflows trained on maritime-specific terminology and standards.</p></article>
            <article className="glass glass--lift" data-reveal><span className="icon-bubble"><Icon name="code" /></span><h3 className="h3">Maritime Software Development Acceleration</h3><p>Accelerate custom coding and software development for maritime systems by leveraging AI-assisted development pipelines tailored to your tech stack.</p></article>
            <article className="glass glass--lift" data-reveal><span className="icon-bubble icon-bubble--warm"><Icon name="image" /></span><h3 className="h3">AI-Driven Content &amp; Image Generation</h3><p>Deploy generative AI for maritime marketing — from precise technical visuals to persuasive business content — aligned with your brand and industry standards.</p></article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="ai-skills">
        <div className="container split">
          <div className="sticky-col" data-reveal>
            <div className="glass glass--flat" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="media" style={{ margin: '0', borderRadius: '0' }}><img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&amp;q=80" alt="AI Skills Development &amp; Corporate Training" width="800" height="450" loading="lazy" decoding="async" /></div>
            </div>
            <span className="eyebrow eyebrow--warm">AI Skills Development</span>
            <h2 className="h2" id="ai-skills">AI Skills Development &amp; Corporate Training</h2>
            <p className="lead">Equipping seafarers, project managers, and onshore engineering teams with the practical skills needed to leverage generative AI in their daily roles. We make cutting-edge AI accessible, actionable, and safe for maritime professionals at every level.</p>
            <div className="btn-row"><a className="btn btn--primary" href="/contact/">Discuss Your Project <Icon name="arrow" /></a></div>
          </div>
          <div className="grid" data-stagger="0.07">
            <article className="glass glass--lift" data-reveal><span className="icon-bubble"><Icon name="cap" /></span><h3 className="h3">Custom AI Curriculum for Maritime Professionals</h3><p>Purpose-built online modules teaching seafarers and engineers how to use AI for troubleshooting electro-technical systems, diagnostics, and onboard decision-making.</p></article>
            <article className="glass glass--lift" data-reveal><span className="icon-bubble"><Icon name="chart" /></span><h3 className="h3">Safety Data &amp; Operational Logistics Workshops</h3><p>Hands-on workshops covering how to apply AI for analyzing safety data, optimizing voyages, and improving operational logistics across your fleet.</p></article>
            <article className="glass glass--lift" data-reveal><span className="icon-bubble"><Icon name="chip" /></span><h3 className="h3">Coding Automation &amp; AI Workflow Training</h3><p>Train your engineering and IT teams to integrate coding automation and advanced AI workflows into existing shipyard or fleet operations — building lasting internal capability.</p></article>
          </div>
        </div>
      </section>
    </>
  );
}
