import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { STATUS_LABELS, getProgressPercentage } from '@/lib/state-machine'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req, 'LEARNER')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { user } = authResult

  try {
    const learner = await prisma.learner.findUnique({
      where: { userId: user.userId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        enrollments: {
          include: { course: true },
          orderBy: { enrolledAt: 'desc' },
          take: 1,
        },
        certificates: { orderBy: { issuedAt: 'desc' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        certificateUploads: { orderBy: { uploadedAt: 'desc' }, take: 1 },
      },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    const currentEnrollment = learner.enrollments[0] ?? null
    const latestCertificate = learner.certificates[0] ?? null
    const latestPayment = learner.payments[0] ?? null
    const latestUpload = learner.certificateUploads[0] ?? null

    // Build next actions
    const actions: string[] = []
    switch (learner.status) {
      case 'CREDENTIAL_ISSUED':
        actions.push('SELECT_COURSE')
        break
      case 'CERTIFICATE_PENDING':
        if (!latestUpload || latestUpload.status === 'REJECTED') {
          actions.push('UPLOAD_CERTIFICATE')
        } else {
          actions.push('AWAIT_APPROVAL')
        }
        break
      case 'PAYMENT_PENDING':
        actions.push('MAKE_PAYMENT')
        break
      case 'ACTIVE':
      case 'LEARNING':
        actions.push('ACCESS_STUDY_MATERIAL')
        actions.push('TAKE_PRACTICE_TEST')
        break
      case 'TEST_COMPLETED':
        actions.push('VIEW_RESULT')
        break
      case 'CERTIFIED':
        actions.push('DOWNLOAD_CERTIFICATE')
        actions.push('ENROLL_ADDON')
        break
      case 'EXPIRED':
      case 'RENEWAL_PENDING':
        actions.push('RENEW_CERTIFICATION')
        break
    }

    return NextResponse.json({
      learner: {
        id: learner.id,
        name: learner.user.name,
        email: learner.user.email,
        phone: learner.user.phone,
        status: learner.status,
        statusLabel: STATUS_LABELS[learner.status],
        progress: getProgressPercentage(learner.status),
        actions,
        currentCourse: currentEnrollment?.course ?? null,
        latestCertificate,
        latestPayment,
        latestUpload,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
