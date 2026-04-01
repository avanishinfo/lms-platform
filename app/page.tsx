'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f4c81 100%)' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'white', letterSpacing: '-0.5px' }}>
          ARIFAC <span style={{ color: '#60a5fa' }}>LMS</span>
        </span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/login" className="btn btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
            Log In
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '5rem 2rem', textAlign: 'center' }}>
        <div className="badge badge-blue" style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
          🏆 Trusted by 5000+ Regulatory Professionals
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Master Regulatory Affairs.<br />
          <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Earn Your Certification.
          </span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '3rem', maxWidth: 600, margin: '0 auto 3rem', lineHeight: 1.6 }}>
          ARIFAC's structured L1–L5 certification tracks guide you from foundation to expert level with industry-relevant, accredited coursework.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 24px rgba(59,130,246,0.4)' }}>
            Register Now — Free
          </Link>
          <Link href="/login" className="btn" style={{ fontSize: '1rem', padding: '0.875rem 2rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem' }}>
            Already Have an Account?
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {[
          { icon: '🎓', title: 'L1 to L5 Tracks', desc: 'Structured progression from foundation to expert-level regulatory certification.' },
          { icon: '📜', title: 'Accredited Certificates', desc: 'Industry-recognized certificates with 2-year validity and renewal support.' },
          { icon: '🧪', title: 'Practice & Main Tests', desc: 'Prepare with practice assessments before taking the proctored main examination.' },
          { icon: '🔐', title: 'Secure & Compliant', desc: 'JWT-secured access with role-based permissions and state-enforced progression.' },
          { icon: '📊', title: 'Live Dashboard', desc: 'Track your learning journey, progress, and certification status in real time.' },
          { icon: '♻️', title: 'Renewal Support', desc: 'Easy re-certification workflow to keep your credentials current.' },
        ].map((f) => (
          <div key={f.title} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>{f.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Ready to advance your career? Start today.
        </p>
        <Link href="/register" className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '1rem', padding: '0.875rem 2.5rem', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
          Begin Certification Journey →
        </Link>
      </div>
    </div>
  )
}
