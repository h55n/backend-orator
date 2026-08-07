import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { questionService } from '../services/api'
import toast from 'react-hot-toast'
import { ClockCounterClockwise, Trash, ArrowRight, CaretLeft, CaretRight, Sparkle } from '@phosphor-icons/react'

const PAGE_SIZE = 10

export default function HistoryPage() {
  const [sessions, setSessions]   = useState([])
  const [page, setPage]           = useState(0)
  const [totalPages, setTotal]    = useState(0)
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(null)

  const fetchHistory = useCallback(async (p) => {
    setLoading(true)
    try {
      const { data } = await questionService.getHistory(p, PAGE_SIZE)
      if (data.content) {
        setSessions(data.content)
        setTotal(data.totalPages)
      } else {
        setSessions(data)
        setTotal(1)
      }
    } catch { toast.error('Failed to load history') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchHistory(page) }, [page, fetchHistory])

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Delete this session and all its questions?')) return
    setDeleting(sessionId)
    try {
      await questionService.deleteSession(sessionId)
      toast.success('Session deleted')
      fetchHistory(page)
    } catch { toast.error('Could not delete session') }
    finally { setDeleting(null) }
  }

  const formatDate = (iso) => {
    try {
      if (!iso) return '';
      const d = Array.isArray(iso) 
        ? new Date(iso[0], iso[1] - 1, iso[2], iso[3], iso[4])
        : new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch(e) { return 'Invalid Date'; }
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-24">
      <div className="mb-12 animate-fade-in border-b border-[var(--color-border-subtle)] pb-8">
        <h1 className="headline-display text-[var(--color-primary)] mb-4">Session History</h1>
        <p className="headline-sm text-[var(--color-on-surface)] opacity-70 max-w-2xl">Review past practice sessions and generated questions.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card skeleton-line bg-white border-none shadow-sm rounded-[24px]" style={{ height: 100 }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card bg-white border-none shadow-sm text-center py-24 rounded-[32px] animate-fade-in">
          <div className="mx-auto mb-8 bg-[var(--color-primary-20)] w-24 h-24 rounded-full flex items-center justify-center">
            <ClockCounterClockwise size={48} weight="duotone" className="text-[var(--color-primary)]" />
          </div>
          <p className="headline-md text-[var(--color-primary)] mb-2">No history yet</p>
          <p className="body-md opacity-70 mb-8">Your generated sessions will appear here.</p>
          <Link to="/generate" className="btn btn-secondary px-8 rounded-full">
            Construct Session
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 stagger">
            {sessions.map((s, idx) => {
              let assessment = null;
              if (s.assessmentData) {
                try {
                  assessment = JSON.parse(s.assessmentData);
                } catch(e) {
                  console.error("Failed to parse assessmentData for session", s.id);
                }
              }
              
              return (
              <div key={s.id} className="relative group animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <Link to={`/session/${s.id}`} className="card block bg-white border-none shadow-sm rounded-[24px] p-8 hover:-translate-y-1 transition-transform">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pr-12">
                    <div className="flex-1">
                      <span className="headline-sm text-[var(--color-primary)] block mb-4 leading-snug">{s.jobRole}</span>
                      <div className="flex flex-wrap gap-2">
                        <span className="chip">{s.technology}</span>
                        <span className="chip bg-[var(--color-neutral)]">{s.experienceLevel}</span>
                        {s.categories?.map(c => (
                          <span key={c} className="badge bg-[var(--color-primary-20)] text-[var(--color-primary)]">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      {assessment && (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-on-surface)] opacity-60 mb-1 flex items-center gap-1"><Sparkle size={12} weight="fill"/> AI Score</span>
                          <span className={`font-sans font-bold text-2xl ${assessment.overallScore >= 80 ? 'text-[var(--color-success)]' : assessment.overallScore >= 60 ? 'text-[var(--color-secondary)]' : 'text-[var(--color-error)]'}`}>{assessment.overallScore}/100</span>
                        </div>
                      )}
                      <div className="flex flex-col items-end gap-2">
                        <span className="badge border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-primary)]">
                          {s.questionCount || 0} Qs
                        </span>
                        <span className="text-sm font-medium text-[var(--color-on-surface)] opacity-50">{formatDate(s.createdAt)}</span>
                      </div>
                      <ArrowRight size={20} className="text-[var(--color-primary)] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" weight="bold" />
                    </div>
                  </div>
                </Link>

                <button
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity bg-[#FFF5F5] rounded-full hover:bg-[#FFE5E5]"
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  aria-label="Delete session"
                  title="Delete Session"
                >
                  {deleting === s.id ? <span className="spinner" style={{width: 20, height: 20, borderTopColor: 'var(--color-error)'}} /> : <Trash size={20} weight="fill" />}
                </button>
              </div>
            )})}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-12">
              <button className="btn btn-outline bg-white rounded-full px-6" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                <CaretLeft size={16} weight="bold" /> Prev
              </button>
              <span className="label-md font-bold text-[var(--color-primary)] opacity-80">
                Page {page + 1} of {totalPages}
              </span>
              <button className="btn btn-outline bg-white rounded-full px-6" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                Next <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
