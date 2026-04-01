import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const courses = await prisma.course.findMany({
      orderBy: { level: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        price: true,
        duration: true,
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Courses list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
