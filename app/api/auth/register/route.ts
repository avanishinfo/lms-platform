import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, phone, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'LEARNER',
        learner: {
          create: {
            status: 'REGISTERED',
            approvals: {
              create: {
                stage: 'SECRETARIAT',
                status: 'APPROVED',
                remarks: 'Auto-approved by system',
                reviewedAt: new Date(),
              },
            },
          },
        },
      },
      include: { learner: true },
    })

    // Auto-advance to APPROVED immediately after secretariat auto-approval
    const learner = user.learner!
    await prisma.learner.update({
      where: { id: learner.id },
      data: { status: 'APPROVED' },
    })

    // Auto-mark eligible
    await prisma.learner.update({
      where: { id: learner.id },
      data: {
        status: 'ELIGIBLE',
        approvals: {
          create: {
            stage: 'ELIGIBILITY',
            status: 'APPROVED',
            remarks: 'Auto-approved by system',
            reviewedAt: new Date(),
          },
        },
      },
    })

    // Issue credentials (CREDENTIAL_ISSUED)
    await prisma.learner.update({
      where: { id: learner.id },
      data: { status: 'CREDENTIAL_ISSUED' },
    })

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: 'LEARNER',
      learnerId: learner.id,
    })

    const response = NextResponse.json({
      message: 'Registration successful. Credentials issued.',
      user: { id: user.id, name: user.name, email: user.email },
      token,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
