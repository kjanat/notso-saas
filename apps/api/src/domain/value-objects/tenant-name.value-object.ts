import { ValueObject } from '../base/value-object.base.js'

interface TenantNameProps {
  value: string
}

export class TenantName extends ValueObject<TenantNameProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TenantNameProps) {
    super(props)
  }

  static create(name: string): TenantName {
    if (!name || name.trim().length === 0) {
      throw new Error('Tenant name cannot be empty')
    }

    if (name.length > 100) {
      throw new Error('Tenant name cannot exceed 100 characters')
    }

    return new TenantName({ value: name.trim() })
  }
}
