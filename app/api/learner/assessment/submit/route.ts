import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { assessmentSubmitSchema } from '@/lib/validations'
import { transition } from '@/lib/state-machine'

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req, 'LEARNER')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { user } = authResult

  try {
    const body = await req.json()
    const parsed = assessmentSubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { assessmentId, answers } = parsed.data

    const learner = await prisma.learner.findUnique({
      where: { userId: user.userId },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    const allowedStatuses = ['LEARNING', 'TEST_COMPLETED', 'ACTIVE']
    if (!allowedStatuses.includes(learner.status)) {
      return NextResponse.json(
        { error: 'Cannot submit assessment in current status' },
        { status: 403 }
      )
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: true },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Grade answers
    let correctAnswers = 0
    for (const question of assessment.questions) {
      const userAnswer = answers.find((a) => a.questionId === question.id)
      if (userAnswer && userAnswer.selectedOption === question.correctOption) {
        correctAnswers++
      }
    }

    const totalQuestions = assessment.questions.length
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    const passed = score >= assessment.passMark
    const resultStatus = passed ? 'PASS' : 'FAIL'

    const result = await prisma.result.create({
      data: {
        learnerId: learner.id,
        assessmentId,
        score,
        totalQuestions,
        correctAnswers,
        status: resultStatus,
        answers: answers,
      },
    })

    // If MAIN test, update learner status
    if (assessment.type === 'MAIN') {
      transition(learner.status, 'TEST_COMPLETED')
      await prisma.learner.update({
        where: { id: learner.id },
        data: { status: 'TEST_COMPLETED' },
      })

      if (passed) {
        // Generate certificate
        const validUntil = new Date()
        validUntil.setFullYear(validUntil.getFullYear() + 2) // 2-year validity

        const enrollment = await prisma.enrollment.findFirst({
          where: { learnerId: learner.id, status: 'ACTIVE' },
        })

        if (enrollment) {
          await prisma.certificate.create({
            data: {
              learnerId: learner.id,
              courseId: enrollment.courseId,
              certificateUrl: `/certificates/${learner.id}-${Date.now()}.pdf`,
              issuedAt: new Date(),
              validUntil,
            },
          })

          await prisma.learner.update({
            where: { id: learner.id },
            data: { status: 'CERTIFIED' },
          })

          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { status: 'COMPLETED' },
          })
        }
      }
    }

    return NextResponse.json({
      result: {
        id: result.id,
        score: Math.round(score),
        correctAnswers,
        totalQuestions,
        status: resultStatus,
        passed,
        assessmentType: assessment.type,
        passMark: assessment.passMark,
      },
    })
  } catch (error) {
    console.error('Assessment submit error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
