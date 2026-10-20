export class FinancialInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FinancialInputError'
  }
}

export function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new FinancialInputError(`${label} debe ser un número mayor que cero.`)
  }
}

export function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new FinancialInputError(`${label} debe ser un número válido.`)
  }
}
