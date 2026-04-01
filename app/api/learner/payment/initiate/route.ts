import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { paymentInitiateSchema } from '@/lib/validations'
import { transition } from '@/lib/state-machine'

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req, 'LEARNER')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { user } = authResult

  try {
    const body = await req.json()
    const parsed = paymentInitiateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { courseId, paymentMethod } = parsed.data

    const learner = await prisma.learner.findUnique({
      where: { userId: user.userId },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    if (learner.status !== 'PAYMENT_PENDING') {
      return NextResponse.json(
        { error: `Payment not allowed in current status: ${learner.status}` },
        { status: 400 }
      )
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Simulate payment (for demo, DEMO method auto-succeeds)
    const paymentSuccess = paymentMethod === 'DEMO' || Math.random() > 0.1 // 90% success for others

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const payment = await prisma.payment.create({
      data: {
        learnerId: learner.id,
        courseId,
        amount: course.price,
        status: paymentSuccess ? 'COMPLETED' : 'FAILED',
        transactionId,
        paymentMethod,
        paymentAt: paymentSuccess ? new Date() : null,
      },
    })

    if (!paymentSuccess) {
      return NextResponse.json(
        {
          error: 'Payment failed. Please try again.',
          transactionId,
          status: 'FAILED',
        },
        { status: 402 }
      )
    }

    // Update enrollment status
    await prisma.enrollment.updateMany({
      where: { learnerId: learner.id, courseId },
      data: { status: 'ACTIVE' },
    })

    // Advance learner state
    transition(learner.status, 'ACTIVE')
    await prisma.learner.update({
      where: { id: learner.id },
      data: { status: 'ACTIVE' },
    })

    return NextResponse.json({
      message: 'Payment successful! Dashboard access unlocked.',
      transactionId,
      status: 'COMPLETED',
      payment: {
        id: payment.id,
        amount: payment.amount,
        paymentAt: payment.paymentAt,
      },
    })
  } catch (error) {
    console.error('Payment error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
