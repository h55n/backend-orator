import { Link } from 'react-router-dom'
import { FileCode, TwitterLogo, GithubLogo, LinkedinLogo } from '@phosphor-icons/react'

export default function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-white pt-24 px-8 mt-auto relative overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16 mb-24 z-10 relative">
        
        {/* Brand */}
        <div className="md:w-1/4">
          <div className="flex items-center gap-2 mb-6">
            <FileCode size={32} weight="duotone" className="text-white" />
            <span className="font-serif italic text-white text-4xl tracking-tight">Orator</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <TwitterLogo size={28} weight="fill" />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <GithubLogo size={28} weight="fill" />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <LinkedinLogo size={28} weight="fill" />
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="md:w-1/2 grid grid-cols-2 gap-12">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6 text-white/50">Product</h4>
            <ul className="flex flex-col gap-4">
              <li><Link to="/generate" className="text-sm font-medium hover:text-white/70 transition-colors">Practice</Link></li>
              <li><Link to="/dashboard" className="text-sm font-medium hover:text-white/70 transition-colors">Dashboard</Link></li>
              <li><Link to="/history" className="text-sm font-medium hover:text-white/70 transition-colors">History</Link></li>
              <li><Link to="/favorites" className="text-sm font-medium hover:text-white/70 transition-colors">Favorites</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6 text-white/50">Legal</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#" className="text-sm font-medium hover:text-white/70 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm font-medium hover:text-white/70 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Right side text */}
        <div className="md:w-1/4 border-l border-white/20 pl-8">
          <p className="text-sm leading-relaxed text-white/70 italic font-serif">
            Orator is the secure, AI-powered platform for practicing and mastering technical interviews. Built for developers to test their limits safely and autonomously.
          </p>
        </div>
      </div>

      {/* Massive Wordmark */}
      <div className="w-full flex justify-center overflow-hidden z-0 select-none opacity-20" style={{ marginTop: '-4rem' }}>
        <h1 className="font-serif italic text-white leading-none tracking-tighter" style={{ fontSize: 'clamp(100px, 25vw, 400px)', marginBottom: '-0.15em' }}>
          Orator
        </h1>
      </div>

      {/* Copyright Bar */}
      <div className="w-full border-t border-white/10 py-6 text-center z-10 relative">
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} Orator. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
