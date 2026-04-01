import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { transition } from '@/lib/state-machine'

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
        enrollments: {
          include: {
            course: {
              include: {
                studyMaterials: { orderBy: { order: 'asc' } },
              },
            },
          },
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    const allowedStatuses = ['ACTIVE', 'LEARNING', 'TEST_COMPLETED', 'CERTIFIED']
    if (!allowedStatuses.includes(learner.status)) {
      return NextResponse.json(
        { error: 'Study material not available. Complete payment first.' },
        { status: 403 }
      )
    }

    if (learner.enrollments.length === 0) {
      return NextResponse.json({ error: 'No active enrollment found' }, { status: 404 })
    }

    // Transition to LEARNING when study material is accessed for the first time
    if (learner.status === 'ACTIVE') {
      transition(learner.status, 'LEARNING')
      await prisma.learner.update({
        where: { id: learner.id },
        data: { status: 'LEARNING' },
      })
    }

    const enrollment = learner.enrollments[0]
    return NextResponse.json({
      course: {
        id: enrollment.course.id,
        name: enrollment.course.name,
        level: enrollment.course.level,
        duration: enrollment.course.duration,
      },
      materials: enrollment.course.studyMaterials,
    })
  } catch (error) {
    console.error('Study material error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
