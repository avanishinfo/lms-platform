'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Course {
  id: string
  name: string
  level: string
  price: number
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const isRenewal = searchParams.get('renewal') === 'true'

  const [course, setCourse] = useState<Course | null>(null)
  const [method, setMethod] = useState('DEMO')
  const [loading, setLoading] = useState(false)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ transactionId: string; amount: number } | null>(null)

  useEffect(() => {
    if (!courseId) { setError('No course selected'); setLoadingCourse(false); return }
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => {
        const c = d.courses?.find((c: Course) => c.id === courseId)
        setCourse(c || null)
        if (!c) setError('Course not found')
      })
      .finally(() => setLoadingCourse(false))
  }, [courseId])

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/learner/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, paymentMethod: method }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Payment failed. Please try again.')
        return
      }
      setSuccess({ transactionId: data.transactionId, amount: data.payment.amount })
    } catch {
      setError('Network error. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>✓</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Payment Successful!</h2>
          <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Transaction ID: <code style={{ background: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>{success.transactionId}</code></p>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Amount Paid: <strong>₹{success.amount.toLocaleString()}</strong></p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem' }}>
              🎉 Your course is now <strong>ACTIVE</strong>. Access your study materials and start learning!
            </p>
          </div>
          <Link href="/learning" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}>
            Start Learning →
          </Link>
          <Link href="/dashboard" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const methods = [
    { id: 'DEMO', label: '🎯 Demo Payment', desc: 'Instant approval for testing' },
    { id: 'UPI', label: '📱 UPI', desc: 'Pay using Google Pay, PhonePe, etc.' },
    { id: 'CARD', label: '💳 Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
    { id: 'NET_BANKING', label: '🏦 Net Banking', desc: 'All major banks supported' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav className="nav">
        <span className="nav-logo">ARIFAC LMS</span>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>← Dashboard</Link>
      </nav>

      <div className="page-header">
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {isRenewal ? '♻️ Renew Certification' : '💳 Complete Payment'}
          </h1>
          <p style={{ opacity: 0.85 }}>Secure payment to unlock your course access</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '-1.5rem auto 0', padding: '0 2rem 4rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Payment Methods */}
        <div className="card" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          {error && <div className="alert alert-error">{error}</div>}
          <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Select Payment Method</h2>
          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {methods.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: `2px solid ${method === m.id ? '#1a56db' : '#e5e7eb'}`, borderRadius: '0.75rem', cursor: 'pointer', background: method === m.id ? '#eff6ff' : 'white', transition: 'all 0.2s' }}>
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} style={{ accentColor: '#1a56db', width: 18, height: 18 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.label}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{m.desc}</div>
                </div>
              </label>
            ))}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.875rem', fontSize: '1rem' }} disabled={loading || !course}>
              {loading ? <><span className="spinner"></span> Processing Payment...</> : `Pay ₹${course?.price.toLocaleString() || '---'}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Order Summary</h2>
          {loadingCourse ? (
            <div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }}></div>
          ) : course ? (
            <div>
              <div style={{ background: 'linear-gradient(135deg, #1a56db, #0694a2)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'white', fontWeight: 800, textAlign: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
                {course.level}
              </div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{course.name}</p>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#6b7280' }}>Course Fee</span>
                <span>₹{course.price.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#6b7280' }}>GST (18%)</span>
                <span>₹0 (incl.)</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0.75rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ color: '#1a56db' }}>₹{course.price.toLocaleString()}</span>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                🔐 256-bit SSL Encrypted Payment
              </div>
            </div>
          ) : <p style={{ color: '#6b7280' }}>Course not found</p>}
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner spinner-dark" style={{ width: 40, height: 40 }}></div></div>}>
      <PaymentContent />
    </Suspense>
  )
}
