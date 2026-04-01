'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardData {
  learner: {
    id: string
    name: string
    email: string
    phone: string
    status: string
    statusLabel: string
    progress: number
    actions: string[]
    currentCourse: { id: string; name: string; level: string; price: number } | null
    latestCertificate: { id: string; issuedAt: string; validUntil: string } | null
    latestPayment: { id: string; amount: number; status: string } | null
    latestUpload: { id: string; status: string; fileName: string } | null
  }
}

const STATUS_COLOR: Record<string, string> = {
  REGISTERED: 'badge-gray', APPROVED: 'badge-blue', ELIGIBLE: 'badge-blue',
  CREDENTIAL_ISSUED: 'badge-purple', COURSE_SELECTED: 'badge-yellow',
  CERTIFICATE_PENDING: 'badge-yellow', PAYMENT_PENDING: 'badge-yellow',
  ACTIVE: 'badge-green', LEARNING: 'badge-green', TEST_COMPLETED: 'badge-blue',
  CERTIFIED: 'badge-green', EXPIRED: 'badge-red', RENEWAL_PENDING: 'badge-yellow',
}

const STEPS = [
  { key: 'REGISTERED', label: 'Registered' },
  { key: 'CREDENTIAL_ISSUED', label: 'Credentials' },
  { key: 'COURSE_SELECTED', label: 'Course' },
  { key: 'PAYMENT_PENDING', label: 'Payment' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'LEARNING', label: 'Learning' },
  { key: 'TEST_COMPLETED', label: 'Tested' },
  { key: 'CERTIFIED', label: 'Certified' },
]

const STATUS_ORDER = ['REGISTERED', 'APPROVED', 'ELIGIBLE', 'CREDENTIAL_ISSUED', 'COURSE_SELECTED', 'CERTIFICATE_PENDING', 'PAYMENT_PENDING', 'ACTIVE', 'LEARNING', 'TEST_COMPLETED', 'CERTIFIED', 'EXPIRED', 'RENEWAL_PENDING']

function getStepStatus(stepKey: string, currentStatus: string): 'done' | 'active' | 'upcoming' {
  const current = STATUS_ORDER.indexOf(currentStatus)
  const step = STATUS_ORDER.indexOf(stepKey)
  if (step < current) return 'done'
  if (step === current || (stepKey === 'COURSE_SELECTED' && (currentStatus === 'CERTIFICATE_PENDING' || currentStatus === 'PAYMENT_PENDING'))) return 'active'
  return 'upcoming'
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/learner/dashboard')
      if (res.status === 401) { router.push('/login'); return }
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setData(json)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-dark" style={{ width: 40, height: 40, margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ padding: '2rem' }}>
      <div className="alert alert-error">{error}</div>
      <button onClick={() => router.push('/login')} className="btn btn-primary">Back to Login</button>
    </div>
  )

  const { learner } = data!

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <nav className="nav">
        <span className="nav-logo">ARIFAC LMS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>👋 {learner.name}</span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Logout</button>
        </div>
      </nav>

      {/* Header */}
      <div className="page-header">
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome back, {learner.name}!</h1>
          <p style={{ opacity: 0.85, marginBottom: '1.5rem', fontSize: '0.95rem' }}>{learner.email}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_COLOR[learner.status] || 'badge-gray'}`}>{learner.statusLabel}</span>
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Overall Progress: {learner.progress}%</span>
          </div>
          <div className="progress-bar" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.2)' }}>
            <div className="progress-fill" style={{ width: `${learner.progress}%`, background: 'rgba(255,255,255,0.9)' }}></div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '-2rem auto 0', padding: '0 2rem 4rem', position: 'relative' }}>
        {/* Step Indicator */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div className="step-indicator">
            {STEPS.map((step, i) => {
              const status = getStepStatus(step.key, learner.status)
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div className="step">
                    <div className={`step-circle ${status}`}>
                      {status === 'done' ? '✓' : i + 1}
                    </div>
                    <span className="step-label" style={{ color: status === 'active' ? '#1a56db' : undefined, fontWeight: status === 'active' ? 700 : undefined }}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`step-line ${status === 'done' ? 'done' : ''}`}></div>}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Current Status Card */}
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Current Status</h2>
              <StatusActions status={learner.status} actions={learner.actions} course={learner.currentCourse} />
            </div>

            {/* Course Info */}
            {learner.currentCourse && (
              <div className="card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Enrolled Course</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1a56db, #0694a2)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'white', fontWeight: 800, fontSize: '1.1rem', minWidth: 56, textAlign: 'center' }}>
                    {learner.currentCourse.level}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, margin: 0, marginBottom: '0.25rem' }}>{learner.currentCourse.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>₹{learner.currentCourse.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Actions */}
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <QuickLinks status={learner.status} actions={learner.actions} courseId={learner.currentCourse?.id} />
              </div>
            </div>

            {/* Certificate Info */}
            {learner.latestCertificate && (
              <div className="card" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#15803d' }}>🏆 Certificate Active</h2>
                <p style={{ fontSize: '0.8rem', color: '#166534', margin: 0 }}>
                  Issued: {new Date(learner.latestCertificate.issuedAt).toLocaleDateString()}<br />
                  Valid until: <strong>{new Date(learner.latestCertificate.validUntil).toLocaleDateString()}</strong>
                </p>
                <Link href="/certificate" className="btn btn-success" style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                  Download Certificate
                </Link>
              </div>
            )}

            {/* Payment Info */}
            {learner.latestPayment && (
              <div className="card" style={{ fontSize: '0.875rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Last Payment</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#6b7280' }}>Amount</span>
                  <span style={{ fontWeight: 600 }}>₹{learner.latestPayment.amount?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <span className={`badge ${learner.latestPayment.status === 'COMPLETED' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.7rem' }}>
                    {learner.latestPayment.status}
                  </span>
                </div>
              </div>
            )}

            {/* Upload Status */}
            {learner.latestUpload && (
              <div className="card" style={{ fontSize: '0.875rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Certificate Upload</h2>
                <p style={{ color: '#6b7280', margin: '0 0 0.5rem' }}>{learner.latestUpload.fileName}</p>
                <span className={`badge ${learner.latestUpload.status === 'APPROVED' ? 'badge-green' : learner.latestUpload.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}`}>
                  {learner.latestUpload.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusActions({ status, actions, course }: { status: string; actions: string[]; course: { id: string; name: string; level: string } | null }) {
  const messages: Record<string, { title: string; desc: string; color: string }> = {
    REGISTERED: { title: '🎉 Registration Complete!', desc: 'Your account has been auto-approved and credentials issued.', color: 'alert-success' },
    APPROVED: { title: '✅ Account Approved', desc: 'Your application has been reviewed and approved.', color: 'alert-success' },
    ELIGIBLE: { title: '✅ Eligibility Confirmed', desc: 'You are eligible to proceed with course selection.', color: 'alert-success' },
    CREDENTIAL_ISSUED: { title: '🔑 Credentials Issued', desc: 'Your learner credentials are ready. Please select a course to continue.', color: 'alert-info' },
    COURSE_SELECTED: { title: '📚 Course Selected', desc: 'You have selected a course. Complete the next step to continue.', color: 'alert-info' },
    CERTIFICATE_PENDING: { title: '📋 Certificate Required', desc: 'This course requires a prior qualification certificate. Upload it and wait for admin approval.', color: 'alert-warning' },
    PAYMENT_PENDING: { title: '💳 Payment Required', desc: 'Complete payment to unlock your course and study materials.', color: 'alert-warning' },
    ACTIVE: { title: '🎓 Course Active!', desc: 'Access your study materials and start learning.', color: 'alert-success' },
    LEARNING: { title: '📖 Currently Learning', desc: 'You are studying. Complete the material and take assessments.', color: 'alert-success' },
    TEST_COMPLETED: { title: '✍️ Tests Completed', desc: 'Your test has been submitted. Check your result.', color: 'alert-info' },
    CERTIFIED: { title: '🏆 Certified!', desc: 'Congratulations! You have successfully completed the course and earned your certificate.', color: 'alert-success' },
    EXPIRED: { title: '⚠️ Certification Expired', desc: 'Your certification has expired. Please renew to maintain your credentials.', color: 'alert-error' },
    RENEWAL_PENDING: { title: '♻️ Renewal Pending', desc: 'Complete payment to renew your certification.', color: 'alert-warning' },
  }

  const msg = messages[status] || { title: 'Status: ' + status, desc: 'Check with admin for next steps.', color: 'alert-info' }

  return (
    <div>
      <div className={`alert ${msg.color}`}><strong>{msg.title}</strong><br />{msg.desc}</div>
    </div>
  )
}

function QuickLinks({ status, actions, courseId }: { status: string; actions: string[]; courseId?: string }) {
  const links: Record<string, { href: string; label: string; variant: string }> = {
    SELECT_COURSE: { href: '/courses', label: '📚 Select a Course', variant: 'btn-primary' },
    UPLOAD_CERTIFICATE: { href: '/courses/certificate-upload', label: '📎 Upload Certificate', variant: 'btn-primary' },
    AWAIT_APPROVAL: { href: '#', label: '⏳ Awaiting Admin Review', variant: 'btn-secondary' },
    MAKE_PAYMENT: { href: `/payment${courseId ? `?courseId=${courseId}` : ''}`, label: '💳 Complete Payment', variant: 'btn-primary' },
    ACCESS_STUDY_MATERIAL: { href: '/learning', label: '📖 Study Material', variant: 'btn-primary' },
    TAKE_PRACTICE_TEST: { href: '/assessment?type=PRACTICE', label: '🧪 Practice Test', variant: 'btn-secondary' },
    VIEW_RESULT: { href: '/result', label: '📊 View My Results', variant: 'btn-primary' },
    DOWNLOAD_CERTIFICATE: { href: '/certificate', label: '🏆 My Certificate', variant: 'btn-primary' },
    ENROLL_ADDON: { href: '/courses', label: '➕ Add-On Courses', variant: 'btn-secondary' },
    RENEW_CERTIFICATION: { href: `/payment${courseId ? `?courseId=${courseId}&renewal=true` : ''}`, label: '♻️ Renew Certification', variant: 'btn-primary' },
  }

  if (actions.length === 0) return <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No actions required right now.</p>

  return (
    <>
      {actions.map(action => {
        const link = links[action]
        if (!link) return null
        return (
          <a key={action} href={link.href} className={`btn ${link.variant}`} style={{ width: '100%', justifyContent: 'flex-start' }}>
            {link.label}
          </a>
        )
      })}
    </>
  )
}
