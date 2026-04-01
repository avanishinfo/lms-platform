import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ARIFAC LMS — Regulatory Affairs Training Platform',
  description:
    'Professional certification and training platform for Regulatory Affairs professionals. Build expertise from L1 to L5.',
  keywords: 'regulatory affairs, LMS, certification, training, ARIFAC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
