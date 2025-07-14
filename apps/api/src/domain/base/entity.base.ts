export abstract class Entity<T> {
  protected readonly _id: string
  public readonly props: T

  constructor(props: T, id: string) {
    this._id = id
    this.props = props
  }

  get id(): string {
    return this._id
  }

  equals(entity: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false
    }

    if (this === entity) {
      return true
    }

    return this._id === entity._id
  }
}

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent<unknown>[] = []

  get domainEvents(): DomainEvent<unknown>[] {
    return this._domainEvents
  }

  protected addDomainEvent(event: DomainEvent<unknown>): void {
    this._domainEvents.push(event)
  }

  clearEvents(): void {
    this._domainEvents = []
  }
}

export interface DomainEvent<TPayload = Record<string, unknown>> {
  aggregateId: string
  eventName: string
  occurredOn: Date
  payload: TPayload
}
