import { createHash, randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto'

export function generateId(prefix?: string): string {
  const id = randomBytes(16).toString('hex')
  return prefix ? `${prefix}_${id}` : id
}

export function generateApiKey(): string {
  return randomBytes(32).toString('base64url')
}

export function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

export function generateSalt(): string {
  return randomBytes(32).toString('hex')
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const passwordHash = hashPassword(password, salt)
  return passwordHash === hash
}

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export function md5(data: string): string {
  return createHash('md5').update(data).digest('hex')
}

export function generateDeploymentKey(): string {
  return `dk_${randomBytes(24).toString('base64url')}`
}

export function generateSessionId(): string {
  return `sess_${randomBytes(32).toString('hex')}`
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || generateSecret(32)
const IV_LENGTH = 16

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  )
  
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  )
  
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  
  return decrypted.toString()
}

export function generateTenantDatabaseName(tenantSlug: string): string {
  const sanitized = tenantSlug.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const hash = sha256(tenantSlug).substring(0, 8)
  return `tenant_${sanitized}_${hash}`
}

export function generateWebhookSignature(payload: string, secret: string): string {
  return createHash('sha256')
    .update(`${secret}:${payload}`)
    .digest('hex')
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return signature === expectedSignature
}