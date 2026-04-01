'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Course {
  id: string
  name: string
  description: string
  level: string
  price: number
  duration: number
}

const LEVEL_COLORS: Record<string, string> = {
  L1: '#10b981', L2: '#3b82f6', L3: '#8b5cf6', L4: '#f59e0b', L5: '#ef4444',
}

const REQUIRES_CERT = ['L2', 'L3', 'L4']

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => { setCourses(d.courses || []); setLoading(false) })
      .catch(() => { setError('Failed to load courses'); setLoading(false) })
  }, [])

  async function handleSelect(courseId: string) {
    setSelecting(courseId)
    setError('')
    try {
      const res = await fetch('/api/learner/course/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      if (data.requiresCertificate) {
        router.push('/courses/certificate-upload')
      } else {
        router.push(`/payment?courseId=${courseId}`)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSelecting(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav className="nav">
        <span className="nav-logo">ARIFAC LMS</span>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>← Dashboard</Link>
      </nav>

      <div className="page-header">
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Choose Your Certification Track</h1>
          <p style={{ opacity: 0.85 }}>Select the level that matches your experience. L2–L4 require a prior qualification certificate.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '-1.5rem auto 0', padding: '0 2rem 4rem' }}>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner spinner-dark" style={{ width: 40, height: 40, margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#6b7280' }}>Loading courses...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {courses.map(course => (
              <div key={course.id} className="card fade-in" style={{ border: `2px solid ${LEVEL_COLORS[course.level]}20`, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ background: LEVEL_COLORS[course.level], color: 'white', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 800, fontSize: '1.25rem' }}>
                    {course.level}
                  </div>
                  {REQUIRES_CERT.includes(course.level) && (
                    <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>📋 Cert Required</span>
                  )}
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{course.name}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem' }}>{course.description}</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#6b7280' }}>
                  <span>⏱ {course.duration}h</span>
                  <span>📜 Certificate Included</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111' }}>₹{course.price.toLocaleString()}</span>
                  <button onClick={() => handleSelect(course.id)} className="btn btn-primary"
                    disabled={selecting === course.id}
                    style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[course.level]}, ${LEVEL_COLORS[course.level]}cc)` }}>
                    {selecting === course.id ? <span className="spinner"></span> : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
