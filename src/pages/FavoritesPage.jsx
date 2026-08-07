import { useState, useEffect, useCallback } from 'react'
import { favoriteService } from '../services/api'
import toast from 'react-hot-toast'
import { Star, MagnifyingGlass, CaretLeft, CaretRight, X } from '@phosphor-icons/react'

const PAGE_SIZE = 20

export default function FavoritesPage() {
  const [questions, setQuestions] = useState([])
  const [page, setPage]           = useState(0)
  const [totalPages, setTotal]    = useState(0)
  const [loading, setLoading]     = useState(true)
  const [removing, setRemoving]   = useState(null)
  const [search, setSearch]       = useState('')

  const fetchFavs = useCallback(async (p) => {
    setLoading(true)
    try {
      const { data } = await favoriteService.getAll(p, PAGE_SIZE)
      if (data.content) {
        setQuestions(data.content)
        setTotal(data.totalPages)
      } else {
        setQuestions(data)
        setTotal(1)
      }
    } catch { toast.error('Failed to load favorites') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchFavs(page) }, [page, fetchFavs])

  const handleRemove = async (questionId) => {
    setRemoving(questionId)
    try {
      await favoriteService.remove(questionId)
      setQuestions(qs => qs.filter(q => q.id !== questionId))
      toast.success('Removed from favorites')
    } catch { toast.error('Could not remove') }
    finally { setRemoving(null) }
  }

  const filtered = questions.filter(q =>
    !search || q.question.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full max-w-5xl mx-auto pb-24">
      <div className="mb-12 animate-fade-in border-b border-[var(--color-border-subtle)] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="headline-display text-[var(--color-primary)] mb-4">Favorites</h1>
          <p className="headline-sm text-[var(--color-on-surface)] opacity-70 max-w-2xl">Questions you've saved for quick review.</p>
        </div>
        
        {!loading && questions.length > 0 && (
          <div className="relative w-full md:w-auto min-w-[300px]">
            <MagnifyingGlass size={16} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] opacity-50" />
            <input
              type="text"
              className="form-input w-full pl-10 bg-[var(--color-neutral)] border-none rounded-xl"
              placeholder="Search saved questions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="card skeleton-line bg-white border-none shadow-sm rounded-[24px]" style={{ height: 200 }} />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="card bg-white border-none shadow-sm text-center py-24 rounded-[32px] animate-fade-in">
          <div className="mx-auto mb-8 bg-[#FFF9EB] w-24 h-24 rounded-full flex items-center justify-center">
            <Star size={48} weight="duotone" className="text-[var(--color-secondary)]" />
          </div>
          <p className="headline-md text-[var(--color-primary)] mb-2">No favorites yet</p>
          <p className="body-md opacity-70">Star any question while reviewing a session to save it here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-white border-none shadow-sm text-center py-24 rounded-[32px] animate-fade-in">
          <MagnifyingGlass size={48} weight="duotone" className="text-[var(--color-primary)] opacity-50 mx-auto mb-4" />
          <p className="headline-md text-[var(--color-primary)] mb-2">No matches</p>
          <p className="body-md opacity-70">Try a different search term.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
            {filtered.map((q, idx) => (
              <div key={q.id} className="card bg-white border-none shadow-sm rounded-[24px] p-8 flex flex-col h-full animate-fade-up group hover:-translate-y-1 transition-transform" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-[var(--color-neutral)] text-[var(--color-primary)]">{q.difficulty}</span>
                    <span className="chip border border-[var(--color-border-subtle)] bg-transparent">{q.category}</span>
                    {q.technology && <span className="chip border border-[var(--color-border-subtle)] bg-transparent">{q.technology}</span>}
                  </div>
                  <button
                    className="p-2 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-neutral)] rounded-full hover:bg-[var(--color-border-subtle)]"
                    onClick={() => handleRemove(q.id)}
                    disabled={removing === q.id}
                    title="Remove"
                  >
                    {removing === q.id ? <span className="spinner" style={{width: 16, height: 16, borderTopColor: 'var(--color-error)'}} /> : <X size={16} weight="bold" />}
                  </button>
                </div>
                
                <p className="headline-sm text-[var(--color-primary)] leading-snug mb-6 flex-1">{q.question}</p>
                
                {q.jobRole && (
                  <p className="body-sm opacity-60 mt-auto pt-4 border-t border-[var(--color-border-subtle)]">
                    For: <strong className="text-[var(--color-primary)] opacity-100">{q.jobRole}</strong>
                  </p>
                )}

                {q.hint && (
                  <details className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                    <summary className="label-md font-bold text-[var(--color-primary)] opacity-80 hover:opacity-100 cursor-pointer select-none">Hint</summary>
                    <p className="mt-4 body-sm opacity-80 leading-relaxed bg-[var(--color-neutral)] p-4 rounded-xl">{q.hint}</p>
                  </details>
                )}
              </div>
            ))}
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
