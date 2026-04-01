import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { adminApproveSchema } from '@/lib/validations'
import { transition } from '@/lib/state-machine'

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req, 'ADMIN')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const body = await req.json()
    const parsed = adminApproveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { learnerId, action, remarks } = parsed.data

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: {
        certificateUploads: {
          where: { status: 'PENDING' },
          orderBy: { uploadedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    if (learner.status !== 'CERTIFICATE_PENDING') {
      return NextResponse.json(
        { error: `Cannot approve/reject in current status: ${learner.status}` },
        { status: 400 }
      )
    }

    const pendingUpload = learner.certificateUploads[0]
    if (!pendingUpload) {
      return NextResponse.json({ error: 'No pending certificate upload found' }, { status: 404 })
    }

    // Update certificate upload status
    await prisma.certificateUpload.update({
      where: { id: pendingUpload.id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        adminNotes: remarks,
      },
    })

    // Update pending approval record
    await prisma.approval.updateMany({
      where: { learnerId, stage: 'CERTIFICATE', status: 'PENDING' },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        remarks,
        reviewedAt: new Date(),
      },
    })

    let newStatus = learner.status
    if (action === 'APPROVE') {
      transition(learner.status, 'PAYMENT_PENDING')
      newStatus = 'PAYMENT_PENDING'
      await prisma.learner.update({
        where: { id: learnerId },
        data: { status: 'PAYMENT_PENDING' },
      })
    }
    // If rejected, learner stays in CERTIFICATE_PENDING so they can re-upload

    return NextResponse.json({
      message: action === 'APPROVE'
        ? 'Certificate approved. Learner can now proceed to payment.'
        : 'Certificate rejected. Learner must re-upload.',
      newStatus,
    })
  } catch (error) {
    console.error('Admin approve error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
