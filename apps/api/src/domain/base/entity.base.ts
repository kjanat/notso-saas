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
  private _domainEvents: DomainEvent[] = []

  get domainEvents(): DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  clearEvents(): void {
    this._domainEvents = []
  }
}

export interface DomainEvent {
  aggregateId: string
  eventName: string
  occurredOn: Date
  payload: any
}
