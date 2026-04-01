'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Approval {
  id: string
  stage: string
  status: string
  createdAt: string
  learner: {
    id: string
    status: string
    user: { name: string; email: string; phone: string }
    certificateUploads: Array<{ id: string; fileName: string; fileUrl: string; uploadedAt: string }>
    enrollments: Array<{ course: { name: string; level: string } }>
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [remarks, setRemarks] = useState<Record<string, string>>({})

  async function fetchApprovals() {
    try {
      const res = await fetch('/api/admin/approvals')
      if (res.status === 401) { router.push('/login'); return }
      if (res.status === 403) { router.push('/dashboard'); return }
      const data = await res.json()
      setApprovals(data.approvals || [])
    } catch {
      setError('Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApprovals() }, [])

  async function handleAction(learnerId: string, action: 'APPROVE' | 'REJECT') {
    setActionLoading(`${learnerId}-${action}`)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId, action, remarks: remarks[learnerId] || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }
      await fetchApprovals()
    } catch {
      alert('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav className="nav">
        <span className="nav-logo">ARIFAC LMS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem' }} className="badge badge-purple">ADMIN</span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Logout</button>
        </div>
      </nav>

      <div className="page-header">
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Admin Control Panel</h1>
          <p style={{ opacity: 0.85 }}>Review and approve/reject learner certificate submissions</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '-1.5rem auto 0', padding: '0 2rem 4rem' }}>
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Pending Approvals', value: approvals.length, color: '#f59e0b', icon: '⏳' },
            { label: 'Certificate Reviews', value: approvals.filter(a => a.stage === 'CERTIFICATE').length, color: '#1a56db', icon: '📋' },
            { label: 'Other Reviews', value: approvals.filter(a => a.stage !== 'CERTIFICATE').length, color: '#10b981', icon: '✅' },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem', background: `${s.color}20`, borderRadius: '0.75rem', padding: '0.75rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner spinner-dark" style={{ width: 40, height: 40, margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#6b7280' }}>Loading pending approvals...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>All Clear!</h2>
            <p style={{ color: '#6b7280' }}>No pending approvals at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {approvals.map(approval => {
              const learner = approval.learner
              const upload = learner.certificateUploads[0]
              const enrollment = learner.enrollments[0]
              const isLoading = actionLoading?.startsWith(learner.id)

              return (
                <div key={approval.id} className="card fade-in" style={{ border: '1px solid #fde68a' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Learner Info */}
                    <div>
                      <h3 style={{ fontWeight: 700, margin: '0 0 0.25rem' }}>{learner.user.name}</h3>
                      <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{learner.user.email}</p>
                      <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{learner.user.phone}</p>
                      {enrollment && (
                        <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                          {enrollment.course.level} — {enrollment.course.name}
                        </span>
                      )}
                      <div style={{ marginTop: '0.5rem' }}>
                        <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>{learner.status}</span>
                      </div>
                    </div>

                    {/* Certificate Upload */}
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Certificate Submission
                      </p>
                      {upload ? (
                        <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                          <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>📄 {upload.fileName}</p>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0' }}>
                            Uploaded: {new Date(upload.uploadedAt).toLocaleString()}
                          </p>
                          <a href={upload.fileUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-block', marginTop: '0.5rem', color: '#1a56db', fontSize: '0.8rem', textDecoration: 'underline' }}>
                            View Certificate →
                          </a>
                        </div>
                      ) : (
                        <div className="alert alert-warning" style={{ fontSize: '0.8rem' }}>No certificate uploaded yet</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Admin Action
                      </p>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Remarks (optional)</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Add review notes..."
                          value={remarks[learner.id] || ''}
                          onChange={e => setRemarks(r => ({ ...r, [learner.id]: e.target.value }))}
                          style={{ resize: 'none', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleAction(learner.id, 'APPROVE')}
                          className="btn btn-success"
                          disabled={isLoading || !upload}
                          style={{ flex: 1, fontSize: '0.85rem' }}>
                          {actionLoading === `${learner.id}-APPROVE` ? <span className="spinner"></span> : '✅ Approve'}
                        </button>
                        <button onClick={() => handleAction(learner.id, 'REJECT')}
                          className="btn btn-danger"
                          disabled={isLoading || !upload}
                          style={{ flex: 1, fontSize: '0.85rem' }}>
                          {actionLoading === `${learner.id}-REJECT` ? <span className="spinner"></span> : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
