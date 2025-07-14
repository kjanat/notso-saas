import { ValueObject } from '../base/value-object.base.js'
import { randomBytes } from 'crypto'

interface ApiKeyProps {
  value: string
}

export class ApiKey extends ValueObject<ApiKeyProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: ApiKeyProps) {
    super(props)
  }

  static create(key: string): ApiKey {
    if (!key || key.trim().length === 0) {
      throw new Error('API key cannot be empty')
    }

    if (!key.startsWith('sk_')) {
      throw new Error('API key must start with sk_')
    }

    if (key.length < 32) {
      throw new Error('API key must be at least 32 characters long')
    }

    return new ApiKey({ value: key })
  }

  static generate(): ApiKey {
    const prefix = 'sk_'
    const randomPart = randomBytes(24).toString('hex')
    return new ApiKey({ value: `${prefix}${randomPart}` })
  }
}
