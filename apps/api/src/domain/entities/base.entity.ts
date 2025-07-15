export abstract class BaseEntity {
  id!: string
  createdAt!: Date
  updatedAt!: Date

  constructor(partial?: Partial<BaseEntity>) {
    this.id = ''
    this.createdAt = new Date()
    this.updatedAt = new Date()

    if (partial) {
      Object.assign(this, partial)
    }
    if (!this.id || this.id === '') {
      this.generateId()
    }
  }

  protected generateId(): string {
    // Simple ID generation - in production, use a proper UUID library
    this.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return this.id
  }

  protected markUpdated(): void {
    this.updatedAt = new Date()
  }
}
