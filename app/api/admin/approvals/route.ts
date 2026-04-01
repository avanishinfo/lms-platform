import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req, 'ADMIN')
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const approvals = await prisma.approval.findMany({
      where: { status: 'PENDING' },
      include: {
        learner: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            certificateUploads: {
              where: { status: 'PENDING' },
              orderBy: { uploadedAt: 'desc' },
              take: 1,
            },
            enrollments: {
              include: { course: true },
              orderBy: { enrolledAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ approvals })
  } catch (error) {
    console.error('Approvals fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
