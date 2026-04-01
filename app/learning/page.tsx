'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Material {
  id: string
  title: string
  content: string
  order: number
}

interface LearningData {
  course: { id: string; name: string; level: string; duration: number }
  materials: Material[]
}

export default function LearningPage() {
  const router = useRouter()
  const [data, setData] = useState<LearningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    fetch('/api/learner/study-material')
      .then(r => {
        if (r.status === 401) { router.push('/login'); throw new Error('Unauthorized') }
        if (r.status === 403) throw new Error('payment_required')
        return r.json()
      })
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message === 'payment_required' ? 'Complete payment to access study materials.' : e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40 }}></div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Access Restricted</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
        <Link href="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  )

  if (!data) return null

  const material = data.materials[active]

  // Simple markdown-to-html renderer (headings, bold, code, lists)
  function renderContent(text: string) {
    return text
      .replace(/^### (.+)$/gm, '<h3 style="font-size:1.1rem;font-weight:700;margin:1.5rem 0 0.5rem">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:1.3rem;font-weight:700;margin:2rem 0 0.75rem;color:#1a56db">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:1.6rem;font-weight:800;margin:0 0 1rem">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:0.15rem 0.4rem;border-radius:0.25rem;font-size:0.85em">$1</code>')
      .replace(/^- (.+)$/gm, '<li style="margin:0.25rem 0;padding-left:0.5rem">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="margin:0.5rem 0 1rem 1.5rem;list-style:disc">$&</ul>')
      .replace(/^\d+\. (.+)$/gm, '<li style="margin:0.25rem 0">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin:0.75rem 0">')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav className="nav">
        <span className="nav-logo">ARIFAC LMS</span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/assessment?type=PRACTICE" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>🧪 Practice Test</Link>
          <Link href="/assessment?type=MAIN" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>✍️ Main Exam</Link>
          <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Dashboard</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sidebar – Table of Contents */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'linear-gradient(135deg, #1a56db, #0694a2)', borderRadius: '0.5rem', padding: '0.75rem', color: 'white', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{data.course.level}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{data.course.name}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.materials.map((m, i) => (
              <button key={m.id} onClick={() => setActive(i)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: active === i ? '#eff6ff' : 'transparent',
                  color: active === i ? '#1a56db' : '#374151',
                  fontWeight: active === i ? 700 : 400,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}>
                <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>{i + 1}.</span> {m.title}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/assessment?type=PRACTICE" className="btn btn-secondary" style={{ fontSize: '0.8rem', justifyContent: 'center' }}>🧪 Practice Test</Link>
            <Link href="/assessment?type=MAIN" className="btn btn-primary" style={{ fontSize: '0.8rem', justifyContent: 'center' }}>✍️ Take Main Exam</Link>
          </div>
        </div>

        {/* Content Area */}
        <div className="card" style={{ lineHeight: 1.8 }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Module {active + 1} of {data.materials.length}</span>
            <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
              <div className="progress-fill" style={{ width: `${((active + 1) / data.materials.length) * 100}%` }}></div>
            </div>
          </div>

          <div
            style={{ color: '#374151', fontSize: '0.95rem' }}
            dangerouslySetInnerHTML={{ __html: renderContent(material.content) }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <button onClick={() => setActive(Math.max(0, active - 1))} className="btn btn-secondary" disabled={active === 0}>
              ← Previous
            </button>
            {active < data.materials.length - 1 ? (
              <button onClick={() => setActive(active + 1)} className="btn btn-primary">Next Module →</button>
            ) : (
              <Link href="/assessment?type=PRACTICE" className="btn btn-primary">Take Practice Test →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
