import type { ValidationError, ValidationResult } from '@saas/types'
import { REGEX_PATTERNS } from '@saas/types'
import { z } from 'zod'

export const emailSchema = z.string().email()
export const slugSchema = z.string().regex(REGEX_PATTERNS.slug)
export const uuidSchema = z.string().uuid()
export const urlSchema = z.string().url()
export const phoneSchema = z.string().regex(REGEX_PATTERNS.phoneNumber)

export function validateEmail(email: string): boolean {
  return REGEX_PATTERNS.email.test(email)
}

export function validateSlug(slug: string): boolean {
  return REGEX_PATTERNS.slug.test(slug)
}

export function validateUUID(uuid: string): boolean {
  return REGEX_PATTERNS.uuid.test(uuid)
}

export function validateURL(url: string): boolean {
  return REGEX_PATTERNS.url.test(url)
}

export function validatePhoneNumber(phone: string): boolean {
  return REGEX_PATTERNS.phoneNumber.test(phone)
}

export function parseZodError(error: z.ZodError): ValidationError[] {
  return error.issues.map(issue => ({
    code: issue.code as string,
    field: issue.path.join('.'),
    message: issue.message,
    value: undefined,
  }))
}

export function createValidationResult(errors: ValidationError[]): ValidationResult {
  return {
    errors,
    isValid: errors.length === 0,
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML brackets
    .replace(/\s+/g, ' ') // Normalize whitespace
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export function validatePasswordStrength(password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
} {
  const requirements = {
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    minLength: password.length >= 8,
  }

  const score = Object.values(requirements).filter(Boolean).length
  const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'

  return {
    isValid: requirements.minLength && score >= 3,
    requirements,
    strength,
  }
}
