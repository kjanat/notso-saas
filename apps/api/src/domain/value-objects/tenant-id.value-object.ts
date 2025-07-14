import { ValueObject } from '../base/value-object.base.js'
import { randomUUID } from 'crypto'

interface TenantIdProps {
  value: string
}

export class TenantId extends ValueObject<TenantIdProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TenantIdProps) {
    super(props)
  }

  static create(id?: string): TenantId {
    return new TenantId({ value: id ?? randomUUID() })
  }
}
