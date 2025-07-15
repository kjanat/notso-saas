import { randomBytes } from 'node:crypto'

export class DeploymentKey {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Deployment key cannot be empty')
    }
  }

  static create(value: string): DeploymentKey {
    return new DeploymentKey(value)
  }

  static generate(): DeploymentKey {
    const key = `dk_${randomBytes(24).toString('hex')}`
    return new DeploymentKey(key)
  }
}
