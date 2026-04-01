'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CertificateUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG and PNG files are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setLoading(true)
    setError('')

    try {
      // In production, upload to S3/Cloudinary first. Here we simulate with a fake URL.
      const fakeUrl = `https://storage.arifac.com/uploads/${Date.now()}-${file.name}`

      const res = await fetch('/api/learner/certificate/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileUrl: fakeUrl }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      setSuccess(true)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Certificate Uploaded!</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Your certificate has been submitted for admin review. You'll be notified once it's approved and you can proceed to payment.
          </p>
          <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav className="nav">
        <span className="nav-logo">ARIFAC LMS</span>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>← Dashboard</Link>
      </nav>

      <div className="page-header">
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Upload Qualification Certificate</h1>
          <p style={{ opacity: 0.85 }}>This course requires a prior qualification certificate for L2–L4 levels.</p>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '-1.5rem auto 0', padding: '0 2rem 4rem' }}>
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <strong>📋 Why is this needed?</strong><br />
          Advanced levels (L2, L3, L4) require proof of a previous qualification. An admin will review and approve your upload before you can proceed to payment.
        </div>

        <div className="card" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Certificate File</label>
              <div
                onClick={() => document.getElementById('file-input')?.click()}
                style={{
                  border: `2px dashed ${file ? '#1a56db' : '#e5e7eb'}`,
                  borderRadius: '0.75rem',
                  padding: '2.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: file ? '#eff6ff' : '#f9fafb',
                  transition: 'all 0.2s',
                }}>
                {file ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                    <p style={{ fontWeight: 600, color: '#1a56db', margin: 0 }}>{file.name}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📁</div>
                    <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 0.25rem' }}>Click to upload file</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>PDF, JPG, PNG — Max 5MB</p>
                  </div>
                )}
                <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
              <strong>Accepted formats:</strong> Degree certificates, diploma certificates, prior-level ARIFAC certificates<br />
              <strong>File requirements:</strong> Clear, legible scan of original document
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/dashboard" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</Link>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || !file}>
                {loading ? <><span className="spinner"></span> Uploading...</> : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
