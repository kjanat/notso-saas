import { ValueObject } from '../base/value-object.base.js'
import { randomBytes } from 'crypto'

interface EmbedIdProps {
  value: string
}

export class EmbedId extends ValueObject<EmbedIdProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: EmbedIdProps) {
    super(props)
  }

  static create(id: string): EmbedId {
    if (!id || id.trim().length === 0) {
      throw new Error('Embed ID cannot be empty')
    }

    // Validate format: alphanumeric only
    const embedIdRegex = /^[a-zA-Z0-9]+$/
    if (!embedIdRegex.test(id)) {
      throw new Error('Embed ID can only contain alphanumeric characters')
    }

    if (id.length !== 12) {
      throw new Error('Embed ID must be exactly 12 characters long')
    }

    return new EmbedId({ value: id })
  }

  static generate(): EmbedId {
    // Generate a 12-character alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bytes = randomBytes(12)
    let id = ''

    for (let i = 0; i < 12; i++) {
      id += chars[bytes[i] % chars.length]
    }

    return new EmbedId({ value: id })
  }
}
