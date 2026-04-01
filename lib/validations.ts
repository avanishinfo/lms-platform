import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{7,15}$/, 'Invalid phone number format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const courseSelectSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
})

export const paymentInitiateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  paymentMethod: z.enum(['CARD', 'UPI', 'NET_BANKING', 'DEMO']),
})

export const assessmentSubmitSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOption: z.enum(['A', 'B', 'C', 'D']),
    })
  ),
})

export const adminApproveSchema = z.object({
  learnerId: z.string().min(1, 'Learner ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  remarks: z.string().optional(),
})

export const certificateUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Invalid file URL'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CourseSelectInput = z.infer<typeof courseSelectSchema>
export type PaymentInitiateInput = z.infer<typeof paymentInitiateSchema>
export type AssessmentSubmitInput = z.infer<typeof assessmentSubmitSchema>
export type AdminApproveInput = z.infer<typeof adminApproveSchema>
export type CertificateUploadInput = z.infer<typeof certificateUploadSchema>
