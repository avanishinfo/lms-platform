'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name || form.name.length < 2) errs.name = 'Name must be at least 2 characters'
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.phone || !/^[+]?[\d\s\-()]{7,15}$/.test(form.phone)) errs.phone = 'Invalid phone number'
    if (!form.password || form.password.length < 8) errs.password = 'At least 8 characters required'
    if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter'
    if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a number'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setServerError(data.error || 'Registration failed'); return }
      router.push('/dashboard')
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = ['REGISTERED', 'APPROVED', 'ELIGIBLE', 'CREDENTIAL ISSUED']

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: '1.75rem', background: 'linear-gradient(135deg, #1a56db, #0694a2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none' }}>
            ARIFAC LMS
          </Link>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>Create your learner account</p>
        </div>

        {/* Auto-approval info banner */}
        <div className="alert alert-info" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          ✅ <strong>Instant Approval</strong> — Upon registration, your account is automatically approved and credentials are issued.
        </div>

        <div className="card" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="John Doe" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="john@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+91-9876543210" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Re-enter password" value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
              {errors.confirm && <span className="form-error">{errors.confirm}</span>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? <><span className="spinner"></span> Creating Account...</> : 'Create Account & Get Credentials'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
