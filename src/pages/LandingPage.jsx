import { Link } from 'react-router-dom'
import { FileCode, Brain, Lightning, ShieldCheck, ArrowRight } from '@phosphor-icons/react'
import Footer from '../components/layout/Footer'


export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-[var(--color-neutral)] text-[var(--color-on-surface)] flex flex-col">
      
      {/* ── Navigation ── */}
      <header className="flex justify-between items-center px-6 md:px-12 py-6 w-full">
        <Link to="/" className="flex items-center gap-2">
          <FileCode size={32} weight="duotone" className="text-[var(--color-primary)]" />
          <span className="font-serif italic text-3xl tracking-tight text-[var(--color-primary)]">Orator</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-6">
          <Link to="/login" className="btn-ghost hidden md:inline-flex text-[var(--color-on-surface)] hover:text-[var(--color-primary)]">Log in</Link>
          <Link to="/register" className="btn btn-secondary text-base px-6 py-3 rounded-full uppercase tracking-widest text-[12px]">Get Started</Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="w-full">
        
        {/* Section 1: Massive Headline */}
        <section className="px-6 md:px-12 pt-[80px] pb-[100px] w-full">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 border border-[var(--color-border-subtle)] rounded-full px-4 py-1 mb-8">
              <span className="text-[10px] uppercase font-bold text-[var(--color-secondary)] tracking-widest">New</span>
              <span className="text-[14px] font-semibold text-[var(--color-primary)]">Introducing Orator 3B →</span>
            </div>
            <h1 className="headline-display text-[var(--color-primary)] mb-6 leading-[1.1] md:text-[80px] md:leading-[88px] tracking-tight">
              You told everyone to practice.
              <br />
              Now give them a secure place to do it.
            </h1>
            <p className="headline-md text-[var(--color-on-surface)] opacity-80 mb-10 max-w-4xl">
              Orator lets every team prepare. Security and IT maintain complete visibility, governance, and control.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-secondary px-8 py-4 rounded-full uppercase tracking-widest text-[12px] font-bold">
                Get Started Free
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Huge Card (like image 4) */}
        <section className="px-4 md:px-8 mb-[168px] w-full">
          <div className="w-full bg-[var(--color-primary)] rounded-[40px] text-white p-12 md:p-24 relative overflow-hidden flex flex-col md:flex-row gap-12">
            
            {/* Left side text */}
            <div className="md:w-1/2 z-10 relative">
              <span className="text-[12px] uppercase tracking-widest font-bold opacity-80 mb-8 block">Our 100x Solution</span>
              <h2 className="headline-display md:text-[72px] md:leading-[80px] tracking-tight mb-8">
                Freedom to practice.
                <br />
                Complete security.
                <br />
                No compromises.
              </h2>
            </div>
            
            {/* Right side bullets */}
            <div className="md:w-1/2 z-10 relative flex flex-col gap-12 mt-12 md:mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="headline-sm mb-3">Visibility across AI-created work</h3>
                  <p className="body-md opacity-90">Know what exists, who built it, and what it touches. Focus on empowering teams without leaving a mess to untangle.</p>
                </div>
                <div>
                  <h3 className="headline-sm mb-3">Control without bottlenecks</h3>
                  <p className="body-md opacity-90">Determine where and how access happens so teams can self-serve and freely build. Make the governed path the easy one.</p>
                </div>
                <div>
                  <h3 className="headline-sm mb-3">Autonomous fixes, controlled by you</h3>
                  <p className="body-md opacity-90">Orator identifies and suggests fixes for anomalies and potential breaks. Your workflows get better the longer they run.</p>
                </div>
                <div>
                  <h3 className="headline-sm mb-3">AI on your terms, always</h3>
                  <p className="body-md opacity-90">Start where you're already working. Choose where, when, and how your LLMs are used, with freedom to switch as your AI strategy evolves.</p>
                </div>
              </div>

              <div className="mt-8 border-t border-white/20 pt-8">
                <p className="body-md opacity-90 mb-6 max-w-md">Orator 3B powers faster delivery, safer operations, and AI execution that scales with confidence.</p>
                <Link to="/register" className="btn bg-white text-[var(--color-primary)] hover:bg-[var(--color-neutral)] px-6 py-3 rounded-full uppercase tracking-widest text-[12px] font-bold inline-block">
                  Explore the product
                </Link>
              </div>
            </div>

            {/* Decorative background shape */}
            <div className="absolute bottom-[-100px] left-[-100px] w-1/2 h-1/2 bg-[var(--color-tertiary)] opacity-50 blur-3xl rounded-full"></div>
          </div>
        </section>

        {/* Section 3: Cards (like image 5) */}
        <section className="px-6 md:px-12 mb-[168px] w-full max-w-[1600px] mx-auto">
          <span className="text-[12px] uppercase tracking-widest font-bold text-[var(--color-on-surface)] opacity-80 mb-4 block">Why Orator?</span>
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <h2 className="headline-display text-[var(--color-primary)] max-w-2xl leading-[1.1]">
              Powerful practice,
              <br />
              proven success.
            </h2>
            <p className="headline-sm text-[var(--color-on-surface)] opacity-80 max-w-lg">
              Orator is uniquely positioned — and proven — to be the single, secure environment for every team's AI-native agents, apps, and automations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[var(--color-primary-60)] rounded-[24px] p-10 text-white flex flex-col justify-between aspect-square">
              <ShieldCheck size={48} weight="duotone" className="mb-6 opacity-80" />
              <div>
                <h3 className="headline-sm mb-3">Born in security, built for the enterprise.</h3>
                <p className="body-md opacity-90">Governance, guardrails, and monitoring across every surface.</p>
              </div>
            </div>
            <div className="bg-[var(--color-primary-60)] rounded-[24px] p-10 text-white flex flex-col justify-between aspect-square">
              <Brain size={48} weight="duotone" className="mb-6 opacity-80" />
              <div>
                <h3 className="headline-sm mb-3">Built for your most important workflows.</h3>
                <p className="body-md opacity-90">Trusted by the world's most ambitious organizations.</p>
              </div>
            </div>
            <div className="bg-[var(--color-primary-60)] rounded-[24px] p-10 text-white flex flex-col justify-between aspect-square">
              <Lightning size={48} weight="duotone" className="mb-6 opacity-80" />
              <div>
                <h3 className="headline-sm mb-3">Vendor-agnostic.</h3>
                <p className="body-md opacity-90">Work across your entire tech stack and within your infrastructure.</p>
              </div>
            </div>
            <div className="bg-[var(--color-primary-60)] rounded-[24px] p-10 text-white flex flex-col justify-between aspect-square">
              <ArrowRight size={48} weight="duotone" className="mb-6 opacity-80" />
              <div>
                <h3 className="headline-sm mb-3">Unmatched time to value.</h3>
                <p className="body-md opacity-90">Teams love Orator for speed, power, and ease of use.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
