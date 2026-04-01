import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface JWTPayload {
  userId: string
  email: string
  role: 'LEARNER' | 'ADMIN'
  learnerId?: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookieToken = req.cookies.get('auth-token')?.value
  return cookieToken || null
}

export function getCurrentUser(req: NextRequest): JWTPayload | null {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(
  req: NextRequest,
  requiredRole?: 'LEARNER' | 'ADMIN'
): { user: JWTPayload } | { error: string; status: number } {
  const user = getCurrentUser(req)
  if (!user) {
    return { error: 'Unauthorized. Please log in.', status: 401 }
  }
  if (requiredRole && user.role !== requiredRole) {
    return { error: 'Forbidden. Insufficient permissions.', status: 403 }
  }
  return { user }
}
