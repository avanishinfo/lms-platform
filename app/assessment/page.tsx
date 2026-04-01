'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  order: number
}

interface Assessment {
  id: string
  title: string
  type: 'PRACTICE' | 'MAIN'
  duration: number
  passMark: number
  totalQuestions: number
  questions: Question[]
}

interface Result {
  id: string
  score: number
  correctAnswers: number
  totalQuestions: number
  status: 'PASS' | 'FAIL'
  passed: boolean
  assessmentType: string
  passMark: number
}

function AssessmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'PRACTICE'

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    fetch(`/api/learner/assessment/start?type=${type}`)
      .then(r => { if (r.status === 401) { router.push('/login'); throw new Error() } return r.json() })
      .then(d => { if (d.error) throw new Error(d.error); setAssessment(d.assessment); setTimeLeft(d.assessment.duration * 60) })
      .catch(e => e.message && setError(e.message))
      .finally(() => setLoading(false))
  }, [type])

  useEffect(() => {
    if (!started || !timeLeft) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const timer = setInterval(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => clearInterval(timer)
  }, [started, timeLeft])

  async function handleSubmit() {
    if (!assessment) return
    setSubmitting(true)
    try {
      const answerArr = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }))
      const res = await fetch('/api/learner/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: assessment.id, answers: answerArr }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data.result)
    } catch {
      setError('Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const answered = Object.keys(answers).length

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><div className="spinner spinner-dark" style={{ width: 40, height: 40 }}></div></div>

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Cannot Access Assessment</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
        <Link href="/learning" className="btn btn-primary">Go to Study Material</Link>
      </div>
    </div>
  )

  if (result) return <ResultScreen result={result} type={type} />

  if (!assessment) return null

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 520, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
          <div style={{ background: type === 'MAIN' ? 'linear-gradient(135deg,#1a56db,#0694a2)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)', borderRadius: '0.5rem', padding: '1.5rem', color: 'white', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{type === 'MAIN' ? '🎯 MAIN EXAMINATION' : '🧪 PRACTICE QUIZ'}</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', margin: '0.25rem 0 0' }}>{assessment.title}</h2>
          </div>
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Questions', value: assessment.totalQuestions },
              { label: 'Duration', value: `${assessment.duration} min` },
              { label: 'Pass Mark', value: `${assessment.passMark}%` },
              { label: 'Type', value: type },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a56db' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          {type === 'MAIN' && (
            <div className="alert alert-warning">
              <strong>⚠️ Important:</strong> This is the official examination. Your result will determine your certification. You cannot retake immediately on failure. Read all questions carefully.
            </div>
          )}
          <button onClick={() => setStarted(true)} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}>
            Start {type === 'MAIN' ? 'Examination' : 'Practice Quiz'} →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="nav-logo">ARIFAC LMS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>ANSWERED</div>
            <div style={{ fontWeight: 800, color: '#1a56db' }}>{answered}/{assessment.totalQuestions}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>TIME LEFT</div>
            <div style={{ fontWeight: 800, color: (timeLeft ?? 0) < 300 ? '#dc2626' : '#111', fontSize: '1.1rem' }}>
              {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
            </div>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting} style={{ fontSize: '0.85rem' }}>
            {submitting ? <span className="spinner"></span> : 'Submit →'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 2rem 4rem' }}>
        {assessment.questions.map((q, i) => (
          <div key={q.id} className="card fade-in" style={{ marginBottom: '1.5rem', border: answers[q.id] ? '2px solid #1a56db' : '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: answers[q.id] ? '#1a56db' : '#f3f4f6', color: answers[q.id] ? 'white' : '#6b7280', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {i + 1}
              </div>
              <p style={{ fontWeight: 600, margin: 0, lineHeight: 1.5, paddingTop: '0.25rem' }}>{q.text}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {(['A', 'B', 'C', 'D'] as const).map(opt => {
                const text = q[`option${opt}` as keyof Question] as string
                const selected = answers[q.id] === opt
                return (
                  <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', border: `2px solid ${selected ? '#1a56db' : '#e5e7eb'}`, borderRadius: '0.5rem', cursor: 'pointer', background: selected ? '#eff6ff' : 'white', transition: 'all 0.15s' }}>
                    <input type="radio" name={`q-${q.id}`} value={opt} checked={selected} onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} style={{ accentColor: '#1a56db', marginTop: '0.15rem' }} />
                    <span style={{ fontSize: '0.875rem' }}><strong>{opt}.</strong> {text}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}

        <button onClick={handleSubmit} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }} disabled={submitting}>
          {submitting ? <><span className="spinner"></span> Submitting...</> : `Submit Assessment (${answered}/${assessment.totalQuestions} answered)`}
        </button>
      </div>
    </div>
  )
}

function ResultScreen({ result, type }: { result: Result; type: string }) {
  const passed = result.passed
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 520, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: passed ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem' }}>
          {passed ? '🏆' : '📋'}
        </div>
        <h2 style={{ fontWeight: 900, fontSize: '1.75rem', marginBottom: '0.5rem', color: passed ? '#065f46' : '#991b1b' }}>
          {passed ? 'Congratulations!' : 'Not Quite There'}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          {passed ? (type === 'MAIN' ? 'You passed the main exam! Your certificate is being generated.' : 'Great job! Ready for the main exam?') : (type === 'MAIN' ? 'You did not reach the pass mark. Review materials and try again.' : 'Keep studying and try the practice quiz again!')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { val: `${result.score}%`, label: 'Score', color: passed ? '#10b981' : '#ef4444' },
            { val: `${result.correctAnswers}/${result.totalQuestions}`, label: 'Correct', color: '#1a56db' },
            { val: `${result.passMark}%`, label: 'Pass Mark', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {passed && type === 'MAIN' && (
            <Link href="/certificate" className="btn btn-success" style={{ justifyContent: 'center' }}>🏆 View My Certificate</Link>
          )}
          {!passed && (
            <Link href="/learning" className="btn btn-primary" style={{ justifyContent: 'center' }}>📖 Review Study Material</Link>
          )}
          {type === 'PRACTICE' && passed && (
            <Link href="/assessment?type=MAIN" className="btn btn-primary" style={{ justifyContent: 'center' }}>✍️ Take Main Exam</Link>
          )}
          <Link href="/dashboard" className="btn btn-secondary" style={{ justifyContent: 'center' }}>Dashboard</Link>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner spinner-dark" style={{ width: 40, height: 40 }}></div></div>}>
      <AssessmentContent />
    </Suspense>
  )
}
