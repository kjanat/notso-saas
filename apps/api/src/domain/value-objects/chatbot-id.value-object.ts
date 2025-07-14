import { randomUUID } from 'crypto'

import { ValueObject } from '../base/value-object.base.js'

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
