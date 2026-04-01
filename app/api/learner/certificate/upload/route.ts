import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { certificateUploadSchema } from '@/lib/validations'
import { transition } from '@/lib/state-machine'

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req, 'LEARNER')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { user } = authResult

  try {
    const body = await req.json()
    const parsed = certificateUploadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { fileName, fileUrl } = parsed.data

    const learner = await prisma.learner.findUnique({
      where: { userId: user.userId },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    if (learner.status !== 'CERTIFICATE_PENDING') {
      return NextResponse.json(
        { error: `Certificate upload not allowed in current status: ${learner.status}` },
        { status: 400 }
      )
    }

    // Create or update certificate upload record
    await prisma.certificateUpload.create({
      data: {
        learnerId: learner.id,
        fileUrl,
        fileName,
        status: 'PENDING',
      },
    })

    // Create an admin approval record
    await prisma.approval.create({
      data: {
        learnerId: learner.id,
        stage: 'CERTIFICATE',
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      message: 'Certificate uploaded successfully. Awaiting admin approval.',
    })
  } catch (error) {
    console.error('Certificate upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
        certificateUploads: { orderBy: { uploadedAt: 'desc' }, take: 5 },
      },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    return NextResponse.json({ uploads: learner.certificateUploads })
  } catch (error) {
    console.error('Certificate fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
