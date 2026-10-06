export class DomainError extends Error {
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.fields = fields
  }
}
