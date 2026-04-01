import { LearnerStatus } from '@prisma/client'

// Valid state transitions map
const VALID_TRANSITIONS: Record<LearnerStatus, LearnerStatus[]> = {
  REGISTERED: ['APPROVED'],
  APPROVED: ['ELIGIBLE'],
  ELIGIBLE: ['CREDENTIAL_ISSUED'],
  CREDENTIAL_ISSUED: ['COURSE_SELECTED'],
  COURSE_SELECTED: ['CERTIFICATE_PENDING', 'PAYMENT_PENDING'],
  CERTIFICATE_PENDING: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['ACTIVE'],
  ACTIVE: ['LEARNING'],
  LEARNING: ['TEST_COMPLETED'],
  TEST_COMPLETED: ['CERTIFIED', 'LEARNING'], // LEARNING allows retake
  CERTIFIED: ['EXPIRED'],
  EXPIRED: ['RENEWAL_PENDING'],
  RENEWAL_PENDING: ['PAYMENT_PENDING'],
}

export function canTransition(from: LearnerStatus, to: LearnerStatus): boolean {
  const allowed = VALID_TRANSITIONS[from] ?? []
  return allowed.includes(to)
}

export function transition(from: LearnerStatus, to: LearnerStatus): LearnerStatus {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid state transition: ${from} → ${to}. Allowed: ${VALID_TRANSITIONS[from]?.join(', ') || 'none'}`
    )
  }
  return to
}

// Determines if a course level requires certificate upload before payment
export function requiresCertificateUpload(level: string): boolean {
  return ['L2', 'L3', 'L4'].includes(level)
}

// Returns the next status after course selection based on level
export function getStatusAfterCourseSelection(level: string): LearnerStatus {
  if (requiresCertificateUpload(level)) {
    return LearnerStatus.CERTIFICATE_PENDING
  }
  return LearnerStatus.PAYMENT_PENDING
}

// Human-readable status labels
export const STATUS_LABELS: Record<LearnerStatus, string> = {
  REGISTERED: 'Registered',
  APPROVED: 'Approved',
  ELIGIBLE: 'Eligible',
  CREDENTIAL_ISSUED: 'Credentials Issued',
  COURSE_SELECTED: 'Course Selected',
  CERTIFICATE_PENDING: 'Certificate Pending',
  PAYMENT_PENDING: 'Payment Pending',
  ACTIVE: 'Active',
  LEARNING: 'Learning',
  TEST_COMPLETED: 'Test Completed',
  CERTIFIED: 'Certified',
  EXPIRED: 'Expired',
  RENEWAL_PENDING: 'Renewal Pending',
}

// Progress percentage
export function getProgressPercentage(status: LearnerStatus): number {
  const order: LearnerStatus[] = [
    'REGISTERED',
    'APPROVED',
    'ELIGIBLE',
    'CREDENTIAL_ISSUED',
    'COURSE_SELECTED',
    'PAYMENT_PENDING',
    'ACTIVE',
    'LEARNING',
    'TEST_COMPLETED',
    'CERTIFIED',
  ]
  const idx = order.indexOf(status)
  if (idx === -1) return 0
  return Math.round((idx / (order.length - 1)) * 100)
}
