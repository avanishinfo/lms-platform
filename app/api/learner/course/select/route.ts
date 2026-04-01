import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { courseSelectSchema } from '@/lib/validations'
import { getStatusAfterCourseSelection, transition } from '@/lib/state-machine'

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req, 'LEARNER')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { user } = authResult

  try {
    const body = await req.json()
    const parsed = courseSelectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { courseId } = parsed.data

    const learner = await prisma.learner.findUnique({
      where: { userId: user.userId },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    if (learner.status !== 'CREDENTIAL_ISSUED') {
      return NextResponse.json(
        { error: `Cannot select course in current status: ${learner.status}` },
        { status: 400 }
      )
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { learnerId_courseId: { learnerId: learner.id, courseId } },
    })

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: { learnerId: learner.id, courseId, status: 'PENDING' },
      })
    }

    const nextStatus = getStatusAfterCourseSelection(course.level)

    transition(learner.status, 'COURSE_SELECTED')
    transition('COURSE_SELECTED', nextStatus)

    await prisma.learner.update({
      where: { id: learner.id },
      data: { status: nextStatus },
    })

    return NextResponse.json({
      message: 'Course selected successfully',
      nextStatus,
      requiresCertificate: nextStatus === 'CERTIFICATE_PENDING',
      course: { id: course.id, name: course.name, level: course.level, price: course.price },
    })
  } catch (error) {
    console.error('Course select error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
