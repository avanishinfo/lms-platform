'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }

      if (data.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: '1.75rem', background: 'linear-gradient(135deg, #1a56db, #0694a2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none' }}>
            ARIFAC LMS
          </Link>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="john@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Your password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? <><span className="spinner"></span> Signing In...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo creds */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#6b7280', border: '1px dashed #e5e7eb' }}>
            <strong style={{ color: '#374151' }}>Demo Credentials:</strong><br />
            Admin: <code>admin@arifac.com</code> / <code>admin123</code><br />
            Learner: <code>john.doe@example.com</code> / <code>learner123</code>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>Register Free</Link>
        </p>
      </div>
    </div>
  )
}
