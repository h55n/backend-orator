import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { questionService, favoriteService } from '../services/api'
import { Plus, ClockCounterClockwise, Star, ChartLineUp, FileCode, ArrowRight } from '@phosphor-icons/react'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  
  const [stats, setStats] = useState({
    sessions: 0,
    questions: 0,
    favorites: 0
  })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      questionService.getHistory(0, 3),
      favoriteService.getAll(0, 1)
    ]).then(([histRes, favRes]) => {
      const historyData = histRes.data.content || histRes.data
      setRecent(historyData.slice(0, 3))
      setStats({
        sessions: histRes.data.totalElements || historyData.length,
        questions: historyData.reduce((acc, curr) => acc + (curr.questionCount || 0), 0),
        favorites: favRes.data.totalElements || favRes.data.length || 0
      })
    }).catch(err => console.error(err))
    .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard max-w-5xl mx-auto w-full">
      
      {/* ── Hero ── */}
      <section className="animate-fade-in py-12 relative border-b border-[var(--color-border-subtle)]">
        <h1 className="headline-display text-[var(--color-primary)]">
          Ready to practice, {user?.email.split('@')[0]}?
        </h1>
        <p className="headline-sm mt-4 text-[var(--color-on-surface)] opacity-70 max-w-2xl">
          Generate targeted interview sessions, track your performance, and master technical concepts with precise AI-driven scenarios.
        </p>
        <div className="mt-8 flex gap-4">
          <Link to="/generate" className="btn btn-secondary px-6 rounded-full font-bold">
            <Plus size={16} weight="bold" /> New Session
          </Link>
          <Link to="/history" className="btn btn-primary px-6 rounded-full">
            View History
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div className="bg-[var(--color-primary-20)] text-[var(--color-primary)] w-12 h-12 rounded-full flex items-center justify-center">
              <ChartLineUp size={24} weight="duotone" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[40px] font-sans font-medium text-[var(--color-primary)] leading-none mb-2">{loading ? '-' : stats.sessions}</span>
            <span className="label-md text-[var(--color-on-surface)] opacity-70">Total Sessions</span>
          </div>
        </div>
        
        <div className="p-8 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div className="bg-[var(--color-primary-20)] text-[var(--color-primary)] w-12 h-12 rounded-full flex items-center justify-center">
              <FileCode size={24} weight="duotone" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[40px] font-sans font-medium text-[var(--color-primary)] leading-none mb-2">{loading ? '-' : stats.questions}</span>
            <span className="label-md text-[var(--color-on-surface)] opacity-70">Questions Generated</span>
          </div>
        </div>

        <div className="p-8 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div className="bg-[var(--color-secondary)] text-white w-12 h-12 rounded-full flex items-center justify-center">
              <Star size={24} weight="duotone" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[40px] font-sans font-medium text-[var(--color-primary)] leading-none mb-2">{loading ? '-' : stats.favorites}</span>
            <span className="label-md text-[var(--color-on-surface)] opacity-70">Saved Favorites</span>
          </div>
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="headline-md text-[var(--color-primary)]">Recent Sessions</h2>
          {recent.length > 0 && (
            <Link to="/history" className="btn btn-ghost font-bold">
              View all <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="card skeleton-line" style={{height: 100, border: 'none', backgroundColor: 'white'}}></div>
            <div className="card skeleton-line" style={{height: 100, border: 'none', backgroundColor: 'white'}}></div>
          </div>
        ) : recent.length === 0 ? (
          <div className="p-16 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex flex-col items-center justify-center text-center gap-4">
            <ClockCounterClockwise size={32} weight="duotone" className="empty-state-icon" />
            <p className="empty-state-title">No history yet</p>
            <p className="empty-state-desc">Your recent practice sessions will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 stagger">
            {recent.map((s, i) => {
              let assessment = null;
              if (s.assessmentData) {
                try {
                  assessment = JSON.parse(s.assessmentData);
                } catch(e) {
                  console.error("Failed to parse assessmentData for session", s.id);
                }
              }
              return (
              <Link key={s.id} to={`/session/${s.id}`} className="p-6 md:px-8 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:shadow-md flex items-center justify-between animate-fade-up hover:-translate-y-1 transition-all" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex-1">
                  <span className="headline-sm text-[var(--color-primary)] block mb-3">{s.jobRole}</span>
                  <div className="flex gap-2">
                    <span className="chip">{s.technology}</span>
                    <span className="chip">{s.experienceLevel}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-12">
                  {assessment && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-on-surface)] opacity-60 mb-1">Score</span>
                      <span className={`font-sans font-bold text-2xl ${assessment.overallScore >= 80 ? 'text-[var(--color-success)]' : assessment.overallScore >= 60 ? 'text-[var(--color-secondary)]' : 'text-[var(--color-error)]'}`}>{assessment.overallScore}/100</span>
                    </div>
                  )}
                  <div className="flex flex-col items-end gap-2">
                    <span className="badge">{s.questionCount || 0} Qs</span>
                    <span className="text-sm text-[var(--color-on-surface)] opacity-50 font-medium">
                      {(() => {
                        try {
                          const date = Array.isArray(s.createdAt) 
                            ? new Date(s.createdAt[0], s.createdAt[1] - 1, s.createdAt[2], s.createdAt[3], s.createdAt[4])
                            : new Date(s.createdAt);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        } catch(e) { return 'Invalid Date'; }
                      })()}
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </section>

    </div>
  )
}
