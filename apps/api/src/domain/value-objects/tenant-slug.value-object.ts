import { ValueObject } from '../base/value-object.base.js'

interface TenantSlugProps {
  value: string
}

export class TenantSlug extends ValueObject<TenantSlugProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TenantSlugProps) {
    super(props)
  }

  static create(slug: string): TenantSlug {
    if (!slug || slug.trim().length === 0) {
      throw new Error('Tenant slug cannot be empty')
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      throw new Error('Tenant slug can only contain lowercase letters, numbers, and hyphens')
    }

    if (slug.length > 50) {
      throw new Error('Tenant slug cannot exceed 50 characters')
    }

    return new TenantSlug({ value: slug.toLowerCase() })
  }
}
