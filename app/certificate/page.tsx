'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Certificate {
  id: string
  courseId: string
  issuedAt: string
  validUntil: string
  certificateUrl: string
  isRenewal: boolean
}

interface LearnerInfo {
  name: string
  email: string
  status: string
  currentCourse: { name: string; level: string } | null
  latestCertificate: Certificate | null
}

export default function CertificatePage() {
  const router = useRouter()
  const [info, setInfo] = useState<LearnerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/learner/dashboard')
      .then(r => { if (r.status === 401) { router.push('/login'); throw new Error() } return r.json() })
      .then(d => {
        if (d.error) { setError(d.error); return }
        setInfo({
          name: d.learner.name,
          email: d.learner.email,
          status: d.learner.status,
          currentCourse: d.learner.currentCourse,
          latestCertificate: d.learner.latestCertificate,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40 }}></div>
    </div>
  )

  const cert = info?.latestCertificate

  if (!cert || info?.status !== 'CERTIFIED') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <h2 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>No Certificate Yet</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Complete the main examination to earn your certificate.</p>
          <Link href="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const issuedDate = new Date(cert!.issuedAt)
  const validDate = new Date(cert!.validUntil)
  const now = new Date()
  const isExpired = validDate < now
  const daysLeft = Math.max(0, Math.floor((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  function handleDownload() {
    // In production this would download the actual PDF
    const content = `ARIFAC CERTIFICATION\n\nThis is to certify that\n\n${info?.name}\n\nhas successfully completed\n\n${info?.currentCourse?.name} (${info?.currentCourse?.level})\n\nIssued: ${issuedDate.toLocaleDateString()}\nValid Until: ${validDate.toLocaleDateString()}\nCertificate ID: ${cert.id}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ARIFAC-Certificate-${info?.name?.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <span className="nav-logo">ARIFAC LMS</span>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>← Dashboard</Link>
      </nav>

      <div style={{ width: '100%', maxWidth: 800, marginTop: 64 }}>
        {/* Certificate Card */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 24px 64px rgba(0,0,0,0.15)', overflow: 'hidden', position: 'relative' }}>
          {/* Certificate Border Decoration */}
          <div style={{ height: 12, background: 'linear-gradient(90deg, #1a56db, #0694a2, #10b981, #f59e0b, #ef4444)' }}></div>

          <div style={{ padding: '3rem', textAlign: 'center' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏛️</div>
              <h1 style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.2em', color: '#6b7280', margin: '0 0 0.25rem', textTransform: 'uppercase' }}>
                Association of Regulatory & Intellectual Affairs for Certification
              </h1>
              <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #1a56db, transparent)', margin: '0.75rem auto', maxWidth: 200 }}></div>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>ARIFAC — Official Certification Document</p>
            </div>

            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '0.5rem' }}>This is to certify that</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #1a56db, #0694a2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 1rem' }}>
              {info?.name}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>has successfully completed</p>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #1e3a8a, #1a56db)', color: 'white', padding: '0.75rem 2rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{info?.currentCourse?.name}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Level {info?.currentCourse?.level}</div>
            </div>
            <p style={{ color: '#374151', fontWeight: 500 }}>and is hereby awarded this Certificate of Completion</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', margin: '2rem 0' }}>
              {[
                { label: 'Date Issued', value: issuedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Valid Until', value: validDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Certificate ID', value: cert.id.slice(0, 12).toUpperCase() },
              ].map(s => (
                <div key={s.label} style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Validity Status */}
            <div style={{ marginBottom: '2rem' }}>
              {isExpired ? (
                <div className="alert alert-error">⚠️ This certificate has <strong>expired</strong>. Please renew to maintain your credentials.</div>
              ) : (
                <div className="alert alert-success">✅ This certificate is <strong>valid</strong> for {daysLeft} more days.</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleDownload} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                ⬇️ Download Certificate
              </button>
              {isExpired && (
                <Link href={`/payment?courseId=${cert.courseId}&renewal=true`} className="btn btn-secondary">
                  ♻️ Renew Certification
                </Link>
              )}
            </div>
          </div>
          <div style={{ height: 8, background: 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981, #0694a2, #1a56db)' }}></div>
        </div>
      </div>
    </div>
  )
}
