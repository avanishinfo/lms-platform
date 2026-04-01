import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req, 'LEARNER')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { user } = authResult
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // PRACTICE or MAIN

  try {
    const learner = await prisma.learner.findUnique({
      where: { userId: user.userId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { course: true },
        },
      },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    const allowedStatuses = ['LEARNING', 'TEST_COMPLETED', 'ACTIVE']
    if (!allowedStatuses.includes(learner.status)) {
      return NextResponse.json(
        { error: 'Assessment not available in current status' },
        { status: 403 }
      )
    }

    if (learner.enrollments.length === 0) {
      return NextResponse.json({ error: 'No active enrollment found' }, { status: 404 })
    }

    const courseId = learner.enrollments[0].courseId
    const assessmentType = (type?.toUpperCase() as 'PRACTICE' | 'MAIN') || 'PRACTICE'

    const assessment = await prisma.assessment.findFirst({
      where: { courseId, type: assessmentType },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            order: true,
            // Do NOT return correctOption here
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        duration: assessment.duration,
        passMark: assessment.passMark,
        totalQuestions: assessment.questions.length,
        questions: assessment.questions,
      },
    })
  } catch (error) {
    console.error('Assessment start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
