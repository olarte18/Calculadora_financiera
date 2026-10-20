import { assertFinitePositive, FinancialInputError } from './errors'
import type { FinancialResult, PerpetuityInputs, PerpetuityVariable } from './types'

/** Resuelve el capital de una perpetuidad o su pago periódico sostenible. */
export function solvePerpetuity(
  inputs: PerpetuityInputs,
  unknown: PerpetuityVariable,
): FinancialResult<PerpetuityVariable> {
  assertFinitePositive(inputs.rate, 'La tasa efectiva por periodo')

  if (unknown === 'capital') {
    if (inputs.payment === undefined) {
      throw new FinancialInputError('Ingresa el pago periódico para calcular el capital.')
    }
    assertFinitePositive(inputs.payment, 'El pago periódico')
    return {
      variable: 'capital',
      value: inputs.payment / inputs.rate,
      unit: 'unidades monetarias',
      formula: 'C = A / i',
    }
  }

  if (inputs.capital === undefined) {
    throw new FinancialInputError('Ingresa el capital disponible para calcular el pago sostenible.')
  }
  assertFinitePositive(inputs.capital, 'El capital')
  return {
    variable: 'payment',
    value: inputs.capital * inputs.rate,
    unit: 'unidades monetarias por periodo',
    formula: 'A = C × i',
  }
}
