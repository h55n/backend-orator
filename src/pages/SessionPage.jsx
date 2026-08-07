import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { questionService, favoriteService } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Star, MagnifyingGlass, Funnel, Copy, Check, Printer, Play, Clock, Sparkle, Warning, PaperPlaneRight } from '@phosphor-icons/react'
import './SessionPage.css'

const CATEGORIES   = ['All', 'Technical', 'Coding', 'SQL', 'HR', 'Aptitude']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

function SkeletonCard() {
  return (
    <div className="card skeleton-card bg-white border-none shadow-sm mb-4" aria-hidden="true" style={{ padding: '24px' }}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <span className="skeleton-pill" style={{ width: 54, height: 24 }} />
          <span className="skeleton-pill" style={{ width: 68, height: 24 }} />
        </div>
        <span className="skeleton-circle" style={{ width: 32, height: 32 }} />
      </div>
      <span className="skeleton-line" style={{ width: '12%', height: 24, marginBottom: 12 }} />
      <span className="skeleton-line" style={{ width: '95%', height: 24, marginBottom: 8 }} />
      <span className="skeleton-line" style={{ width: '80%', height: 24, marginBottom: 8 }} />
      <span className="skeleton-line" style={{ width: '60%', height: 24 }} />
    </div>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { toast.error('Could not copy') }
  }
  return (
    <button className="icon-btn opacity-60 hover:opacity-100 transition-opacity p-2" onClick={handleCopy} title="Copy">
      {copied ? <Check size={16} weight="bold" className="text-[var(--color-success)]" /> : <Copy size={16} weight="duotone" className="text-[var(--color-primary)]" />}
    </button>
  )
}

export default function SessionPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [session,    setSession]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [favorites,  setFavorites]  = useState(new Set())
  const [favLoading, setFavLoading] = useState(new Set())
  
  const [catFilter,  setCatFilter]  = useState('All')
  const [diffFilter, setDiffFilter] = useState('All')
  const [search,     setSearch]     = useState('')

  const [mode, setMode] = useState('review')
  const [practiceIndex, setPracticeIndex] = useState(0)
  
  const [answers, setAnswers] = useState({}) 
  const [pasteCounts, setPasteCounts] = useState({})
  const [tabSwitches, setTabSwitches] = useState({}) 
  
  const [timer, setTimer] = useState(0)
  const [showHint, setShowHint] = useState(false)
  
  const [assessmentData, setAssessmentData] = useState(null)

  const timerRef = useRef(null)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && mode === 'practice') {
        const qId = session?.questions[practiceIndex]?.id
        if (qId) {
          setTabSwitches(prev => ({ ...prev, [qId]: (prev[qId] || 0) + 1 }))
          toast('Tab switched during practice. This may affect your score.', { icon: '⚠️', duration: 3000 })
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [mode, session, practiceIndex])

  useEffect(() => {
    questionService.getSessionById(id)
      .then(({ data }) => {
        setSession(data)
        const favSet = new Set(data.questions?.filter(q => q.isFavorite).map(q => q.id))
        setFavorites(favSet)
        if (data.assessmentData) {
          setAssessmentData(JSON.parse(data.assessmentData))
        }
      })
      .catch(() => { toast.error('Session not found'); navigate('/history') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    if (mode === 'practice') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [mode])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleFav = async (questionId) => {
    if (favLoading.has(questionId)) return
    setFavLoading(s => new Set([...s, questionId]))
    try {
      if (favorites.has(questionId)) {
        await favoriteService.remove(questionId)
        setFavorites(s => { const n = new Set(s); n.delete(questionId); return n })
      } else {
        await favoriteService.add(questionId)
        setFavorites(s => new Set([...s, questionId]))
      }
    } catch { toast.error('Could not update favorite') }
    finally { setFavLoading(s => { const n = new Set(s); n.delete(questionId); return n }) }
  }

  const startPractice = () => {
    setMode('practice')
    setPracticeIndex(0)
    setAnswers({})
    setPasteCounts({})
    setTabSwitches({})
    setTimer(0)
    setShowHint(false)
  }

  const nextQuestion = () => {
    if (practiceIndex < session.questions.length - 1) {
      setPracticeIndex(i => i + 1)
      setShowHint(false)
    }
  }

  const prevQuestion = () => {
    if (practiceIndex > 0) {
      setPracticeIndex(i => i - 1)
      setShowHint(false)
    }
  }

  const handlePaste = (e, qId) => {
    e.preventDefault()
    setPasteCounts(prev => ({ ...prev, [qId]: (prev[qId] || 0) + 1 }))
    toast.error('Pasting is disabled. Please type your answer manually.')
  }

  const submitAssessment = async () => {
    setMode('assessing')
    
    const answersPayload = {}
    session.questions.forEach(q => {
      answersPayload[q.id] = {
        text: answers[q.id] || '',
        pasteCount: pasteCounts[q.id] || 0,
        tabSwitches: tabSwitches[q.id] || 0
      }
    })

    try {
      const { data } = await questionService.assessSession(session.id, { answers: answersPayload })
      setAssessmentData(data)
      setMode('summary')
      toast.success('Assessment complete!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assessment failed. Please try again.')
      setMode('practice')
    }
  }

  if (loading) return (
    <div className="session-page max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-4 mb-8">
        <button className="btn btn-ghost font-bold self-start opacity-50"><ArrowLeft size={16} /> Back</button>
        <span className="skeleton-line" style={{ width: 250, height: 48, backgroundColor: 'white' }} />
      </div>
      <div className="flex flex-col gap-6">
        <SkeletonCard /><SkeletonCard />
      </div>
    </div>
  )

  const questions = session?.questions || []
  
  if (mode === 'assessing') {
    return (
      <div className="session-page max-w-xl mx-auto w-full flex-1 flex flex-col items-center justify-center animate-fade-in py-24">
        <div className="card bg-white border-none shadow-sm text-center p-12 w-full">
          <div className="pulsing-brain mx-auto mb-8 bg-[var(--color-primary-20)] w-24 h-24 rounded-full flex items-center justify-center">
            <Sparkle size={48} weight="duotone" className="text-[var(--color-primary)]" />
          </div>
          <h2 className="headline-md text-[var(--color-primary)] mb-4">AI is analyzing your answers</h2>
          <p className="body-md text-[var(--color-on-surface)] opacity-70 mb-8 max-w-md mx-auto">Checking technical accuracy, problem-solving approach, and detecting copy-paste signals...</p>
          <div className="skeleton-line bg-[var(--color-neutral)] h-2 rounded-full mb-4 w-full" />
          <div className="skeleton-line bg-[var(--color-neutral)] h-2 rounded-full w-4/5 mx-auto" />
        </div>
      </div>
    )
  }

  if (mode === 'summary' && assessmentData) {
    const { overallScore, overallFeedback, questionAssessments } = assessmentData
    
    return (
      <div className="session-page max-w-5xl mx-auto w-full animate-fade-in">
        <div className="mb-8">
          <button className="btn btn-ghost font-bold opacity-60 mb-4" onClick={() => setMode('review')}>
            <ArrowLeft size={16} /> Back to Review
          </button>
          <h1 className="headline-display text-[var(--color-primary)]">Assessment Results</h1>
        </div>

        <div className="summary-dashboard flex flex-col gap-8">
          <div className="card bg-[var(--color-primary)] text-white border-none p-12 flex flex-col md:flex-row gap-12 items-center md:items-start rounded-[32px]">
            <div className="score-ring shrink-0 flex items-center justify-center w-40 h-40 rounded-full border-[8px] bg-white text-[var(--color-primary)]" 
                 style={{ borderColor: overallScore >= 80 ? 'var(--color-success)' : overallScore >= 60 ? 'var(--color-secondary)' : 'var(--color-error)' }}>
              <span className="headline-display tracking-tight leading-none">{overallScore}</span>
            </div>
            
            <div className="flex-1">
              <h2 className="headline-md mb-4 text-white">Overall Feedback</h2>
              <p className="body-lg opacity-90 leading-relaxed mb-8">{overallFeedback}</p>
              
              <div className="flex gap-4">
                <button className="btn bg-white text-[var(--color-primary)] hover:bg-[var(--color-neutral)] px-6 py-3 rounded-full uppercase tracking-widest text-[12px] font-bold" onClick={() => setMode('review')}>
                  Review Answers
                </button>
                <button className="btn btn-outline border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-full uppercase tracking-widest text-[12px] font-bold" onClick={startPractice}>
                  Try Again
                </button>
              </div>
            </div>
          </div>

          <h3 className="headline-md text-[var(--color-primary)] mt-8 mb-4">Detailed Question Feedback</h3>
          <div className="flex flex-col gap-6">
            {questionAssessments?.map((qa) => {
              const q = questions.find(x => x.id === qa.questionId)
              return (
                <div key={qa.questionId} className="card bg-white border-none shadow-sm p-8 flex flex-col gap-6 rounded-[24px]">
                  <div className="flex justify-between items-start gap-6">
                    <h4 className="headline-sm text-[var(--color-primary)] flex-1 leading-snug">{q?.question}</h4>
                    <span className="badge bg-[var(--color-neutral)] text-[var(--color-primary)] px-4 py-2 text-sm font-bold shrink-0">{qa.score}/10</span>
                  </div>
                  
                  <div className="p-6 bg-[var(--color-neutral)] rounded-xl text-[var(--color-on-surface)] opacity-80 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {answers[qa.questionId] || <span className="opacity-50 italic">No answer provided</span>}
                  </div>
                  
                  <div className="text-[var(--color-on-surface)] body-md leading-relaxed">
                    <strong className="text-[var(--color-primary)]">AI Feedback: </strong> {qa.feedback}
                  </div>

                  {qa.isAiGenerated && (
                    <div className="flex items-start gap-4 p-6 bg-[#FFF5F5] text-[var(--color-error)] rounded-xl border border-[#FFD6D6] mt-2">
                      <Warning size={24} weight="duotone" className="shrink-0" />
                      <div>
                        <strong className="block mb-1 headline-sm">Flagged for AI Generation / Cheating</strong>
                        <p className="body-sm">{qa.aiReasoning}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'practice') {
    const q = questions[practiceIndex]
    const progress = ((practiceIndex) / questions.length) * 100
    const isLast = practiceIndex === questions.length - 1
    
    return (
      <div className="session-page flex flex-col h-full max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <button className="btn btn-ghost font-bold opacity-60" onClick={() => setMode('review')}>
            <ArrowLeft size={16} /> Exit Practice
          </button>
          
          <div className="flex-1 mx-12 hidden md:flex items-center gap-4">
            <span className="label-md opacity-70 whitespace-nowrap">Q {practiceIndex + 1} of {questions.length}</span>
            <div className="h-2 flex-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-primary)] transition-all duration-300" style={{width: `${progress}%`}}/>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono bg-white px-4 py-2 rounded-full shadow-sm text-[var(--color-primary)] font-bold">
            <Clock size={16} weight="bold" /> {formatTime(timer)}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          <div className="card bg-white border-none shadow-sm p-10 flex flex-col flex-1 rounded-[24px]">
            <div className="flex gap-2 mb-6">
              <span className="chip">{q.difficulty}</span>
              <span className="chip bg-[var(--color-neutral)]">{q.category}</span>
            </div>
            <h2 className="headline-sm text-[var(--color-primary)] leading-snug mb-8">{q.question}</h2>
            
            {q.hint && (
              <div className="mt-auto pt-6 border-t border-[var(--color-border-subtle)]">
                <button onClick={() => setShowHint(!showHint)} className="label-md font-bold text-[var(--color-primary)] hover:opacity-80 transition-opacity">
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                {showHint && <p className="animate-fade-in body-sm opacity-80 mt-4 leading-relaxed bg-[var(--color-neutral)] p-4 rounded-xl">{q.hint}</p>}
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1">
            <textarea 
              className="flex-1 min-h-[400px] w-full p-8 text-[var(--color-on-surface)] bg-white border-none shadow-sm rounded-[24px] font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--color-primary-60)] transition-all mb-6"
              placeholder="Type your answer or pseudo-code here... (Copy-pasting is monitored)"
              value={answers[q.id] || ''}
              onChange={e => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
              onPaste={(e) => handlePaste(e, q.id)}
            />
            
            <div className="flex items-center justify-between">
              <button 
                className="btn btn-outline border-[var(--color-border-subtle)] text-[var(--color-primary)] bg-white hover:bg-[var(--color-neutral)] px-8 py-3 rounded-full" 
                onClick={prevQuestion} 
                disabled={practiceIndex === 0}
              >
                Previous
              </button>
              
              {!isLast ? (
                <button 
                  className="btn btn-secondary px-8 py-3 rounded-full uppercase tracking-widest text-[12px] font-bold" 
                  onClick={nextQuestion}
                  disabled={!answers[q.id] || answers[q.id].length < 10}
                >
                  Next Question
                </button>
              ) : (
                <button 
                  className="btn btn-secondary flex items-center gap-2 px-8 py-3 rounded-full uppercase tracking-widest text-[12px] font-bold" 
                  onClick={submitAssessment}
                  disabled={!answers[q.id] || answers[q.id].length < 10}
                >
                  <PaperPlaneRight size={16} weight="bold" /> Submit Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filtered = questions.filter(q => {
    const catOk  = catFilter  === 'All' || q.category  === catFilter
    const diffOk = diffFilter === 'All' || q.difficulty === diffFilter
    const srchOk = !search || q.question.toLowerCase().includes(search.toLowerCase())
    return catOk && diffOk && srchOk
  })

  return (
    <div className="session-page max-w-5xl mx-auto w-full pb-24">
      <div className="mb-12">
        <button className="btn btn-ghost font-bold opacity-60 mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} weight="bold" /> Back
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--color-border-subtle)] pb-8">
          <div>
            <h1 className="headline-display text-[var(--color-primary)] leading-none mb-4">{session?.jobRole}</h1>
            <div className="flex gap-2">
              <span className="badge">{session?.technology}</span>
              <span className="badge">{session?.experienceLevel}</span>
              <span className="badge bg-[var(--color-primary-20)] text-[var(--color-primary)]">{filtered.length} Qs</span>
            </div>
          </div>
          <div className="flex gap-4">
            {assessmentData && (
              <button className="btn btn-outline border-[var(--color-border-subtle)] text-[var(--color-primary)] hover:bg-[var(--color-neutral)] px-6 rounded-full font-bold text-xs uppercase tracking-widest" onClick={() => setMode('summary')}>
                View Assessment
              </button>
            )}
            <button className="btn btn-outline border-[var(--color-border-subtle)] text-[var(--color-primary)] hover:bg-[var(--color-neutral)] px-4 rounded-full" onClick={() => window.print()} title="Export PDF">
              <Printer size={16} weight="bold" /> <span className="hidden md:inline font-bold text-xs uppercase tracking-widest ml-2">Export</span>
            </button>
            <button className="btn btn-secondary px-6 rounded-full font-bold text-xs uppercase tracking-widest" onClick={startPractice}>
              <Play size={16} weight="fill" /> Practice Mode
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-sm mb-12 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass size={16} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] opacity-50" />
          <input type="text" className="form-input w-full pl-10 bg-[var(--color-neutral)] border-none rounded-xl" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Funnel size={16} weight="bold" className="text-[var(--color-primary)] shrink-0" />
          <div className="flex gap-2">
            {CATEGORIES.map(c => <button key={c} className={`chip whitespace-nowrap ${catFilter === c ? 'active' : 'bg-transparent border border-[var(--color-border-subtle)] hover:bg-[var(--color-neutral)]'}`} onClick={() => setCatFilter(c)}>{c}</button>)}
          </div>
          <div className="w-px h-6 bg-[var(--color-border-subtle)] shrink-0" />
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => <button key={d} className={`chip whitespace-nowrap ${diffFilter === d ? 'active' : 'bg-transparent border border-[var(--color-border-subtle)] hover:bg-[var(--color-neutral)]'}`} onClick={() => setDiffFilter(d)}>{d}</button>)}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card bg-white border-none shadow-sm mt-8 rounded-[24px]">
          <MagnifyingGlass size={48} weight="duotone" className="text-[var(--color-primary)] opacity-50 mb-4" />
          <p className="headline-sm text-[var(--color-primary)] mb-2">No questions match</p>
          <p className="body-md opacity-70">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 stagger">
          {filtered.map((q, idx) => {
            const qa = assessmentData?.questionAssessments?.find(x => x.questionId === q.id)
            return (
            <div key={q.id} className="card bg-white border-none shadow-sm rounded-[24px] p-8 hover:-translate-y-1 transition-transform" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  <span className="badge bg-[var(--color-neutral)] text-[var(--color-primary)]">{q.difficulty}</span>
                  <span className="chip border border-[var(--color-border-subtle)] bg-transparent">{q.category}</span>
                </div>
                <div className="flex gap-2">
                  <CopyBtn text={q.question} />
                  <button
                    className={`icon-btn p-2 transition-colors ${favorites.has(q.id) ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)] opacity-40 hover:opacity-100'}`}
                    onClick={() => toggleFav(q.id)}
                    disabled={favLoading.has(q.id)}
                    title="Favorite"
                  >
                    {favLoading.has(q.id) ? <span className="spinner" style={{width: 16, height: 16}} /> : (favorites.has(q.id) ? <Star weight="fill" size={20} /> : <Star size={20} weight="duotone" />)}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary-20)] text-[var(--color-primary)] font-bold text-sm shrink-0">{idx + 1}</span>
                <div className="flex-1 pt-1">
                  <p className="headline-sm text-[var(--color-primary)] leading-snug">{q.question}</p>
                  
                  {qa && (
                    <div className="mt-6 p-6 bg-[var(--color-neutral)] rounded-xl text-sm">
                      <div className="flex justify-between items-center mb-4">
                        <span className="label-md font-bold text-[var(--color-primary)]">AI Score: {qa.score}/10</span>
                        {qa.isAiGenerated && <span className="text-[var(--color-error)] font-bold flex items-center gap-1 bg-[#FFF5F5] px-3 py-1 rounded-full"><Warning size={14} weight="bold"/> Flagged</span>}
                      </div>
                      <p className="body-sm opacity-80 leading-relaxed">{qa.feedback}</p>
                    </div>
                  )}

                  {q.hint && (
                    <details className="mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                      <summary className="label-md font-bold text-[var(--color-primary)] opacity-80 hover:opacity-100 cursor-pointer select-none">Hint / Key points</summary>
                      <p className="mt-4 body-sm opacity-80 leading-relaxed bg-[var(--color-neutral)] p-4 rounded-xl">{q.hint}</p>
                    </details>
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
