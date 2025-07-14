import { ValueObject } from '../base/value-object.base.js'
import { randomUUID } from 'crypto'

interface ChatbotIdProps {
  value: string
}

export class ChatbotId extends ValueObject<ChatbotIdProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: ChatbotIdProps) {
    super(props)
  }

  static create(id?: string): ChatbotId {
    return new ChatbotId({ value: id ?? randomUUID() })
  }
}
