import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { questionService } from '../services/api'
import toast from 'react-hot-toast'
import { CaretDown, Sparkle } from '@phosphor-icons/react'
import './GeneratePage.css'

const JOB_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Scientist', 'DevOps Engineer'
]
const TECHNOLOGIES = [
  'Java', 'Spring Boot', 'React', 'Node.js', 'Python', 'AWS'
]
const EXPERIENCE = ['Fresher', 'Intermediate', 'Experienced']
const CATEGORIES = ['Technical', 'Coding', 'SQL', 'HR', 'Aptitude']

export default function GeneratePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    jobRole:         searchParams.get('jobRole') || 'Software Engineer',
    technology:      searchParams.get('technology') || 'Java',
    experienceLevel: 'Intermediate',
    categories:      ['Technical', 'Coding'],
    questionCount:   10
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: null }))
  }

  const toggleCategory = (cat) => {
    setForm(p => {
      const current = p.categories
      if (current.includes(cat)) {
        if (current.length === 1) return p // keep at least 1
        return { ...p, categories: current.filter(c => c !== cat) }
      }
      return { ...p, categories: [...current, cat] }
    })
    setErrors(p => ({ ...p, categories: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    // Basic validation
    const newErrors = {}
    if (!form.jobRole)    newErrors.jobRole    = true
    if (!form.technology) newErrors.technology = true
    if (form.categories.length === 0) newErrors.categories = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)
    const t = toast.loading('Constructing scenario...', { style: { minWidth: 250 }})

    try {
      const { data } = await questionService.generate(form)
      toast.success('Session ready!', { id: t })
      navigate(`/session/${data.sessionId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate session', { id: t })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="generate-page w-full max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="headline-display text-[var(--color-primary)] mb-4">
          Configure Your Session
        </h1>
        <p className="headline-sm text-[var(--color-on-surface)] opacity-70 max-w-2xl mx-auto">
          Target specific skills and difficulty levels to generate a highly realistic interview scenario.
        </p>
      </div>

      <form className="p-8 md:p-12 rounded-[32px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-sm" onSubmit={handleSubmit}>
        
        <div className="pb-8 border-b border-[var(--color-border-subtle)] relative">
          <h2 className="headline-sm text-[var(--color-primary)] flex items-center gap-3 mb-8">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-primary-20)] text-[var(--color-primary)] text-sm font-bold">1</span> 
            Target Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Job Role */}
            <div className="form-group">
              <label className="label-md font-bold mb-2 block">Job Role <span className="text-[var(--color-error)]">*</span></label>
              <div className="relative">
                <select className={`form-select ${errors.jobRole ? 'error' : ''}`}
                  value={form.jobRole} onChange={e => handleChange('jobRole', e.target.value)}>
                  <option value="">Select Role</option>
                  {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={16} weight="bold" />
              </div>
            </div>

            {/* Technology */}
            <div className="form-group">
              <label className="label-md font-bold mb-2 block">Primary Technology <span className="text-[var(--color-error)]">*</span></label>
              <div className="relative">
                <select className={`form-select ${errors.technology ? 'error' : ''}`}
                  value={form.technology} onChange={e => handleChange('technology', e.target.value)}>
                  <option value="">Select Technology</option>
                  {TECHNOLOGIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={16} weight="bold" />
              </div>
            </div>
          </div>

          {/* Experience Level */}
          <div className="form-group mb-8">
            <label className="label-md font-bold mb-3 block">Experience Level <span className="text-[var(--color-error)]">*</span></label>
            <div className="flex gap-3 flex-wrap">
              {EXPERIENCE.map(level => (
                <button
                  key={level} type="button"
                  className={`chip ${form.experienceLevel === level ? 'active' : ''}`}
                  onClick={() => handleChange('experienceLevel', level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="form-group mb-8">
            <label className="label-md font-bold mb-1 block">Focus Areas <span className="text-[var(--color-error)]">*</span></label>
            <p className="body-sm opacity-60 mb-4">Select one or more areas to construct your practice session.</p>
            <div className="flex gap-3 flex-wrap">
              {CATEGORIES.map(cat => {
                const isActive = form.categories.includes(cat)
                return (
                  <button
                    key={cat} type="button"
                    className={`chip ${isActive ? 'active' : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
            {errors.categories && <span className="text-[var(--color-error)] text-sm mt-2 block">Please select at least one category</span>}
          </div>

          {/* Question Count */}
          <div className="form-group">
            <label className="label-md font-bold mb-3 flex items-center justify-between">
              <span>Question Count: <strong className="text-[var(--color-primary)] ml-2">{form.questionCount}</strong></span>
            </label>
            <input 
              type="range" min="5" max="30" step="1"
              value={form.questionCount}
              onChange={e => handleChange('questionCount', parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--color-neutral)] rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <div className="flex justify-between text-xs opacity-50 mt-2 font-bold">
              <span>5</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="body-sm opacity-60 italic flex items-center gap-2">
            <Sparkle size={16} weight="duotone" /> Uses AI models for realistic generation
          </p>
          <button type="submit" className="btn btn-secondary px-8 py-3 rounded-full text-[14px] w-full md:w-auto" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Generate Questions'}
          </button>
        </div>
      </form>
    </div>
  )
}
