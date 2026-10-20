import { assertFinite, assertFinitePositive, FinancialInputError } from './errors'
import type { CompoundInterestInputs, CompoundInterestVariable, FinancialResult } from './types'

const formulas: Record<CompoundInterestVariable, string> = {
  presentValue: 'VP = VF / (1 + i)ⁿ',
  futureValue: 'VF = VP × (1 + i)ⁿ',
  rate: 'i = (VF / VP)^(1 / n) − 1',
  periods: 'n = ln(VF / VP) / ln(1 + i)',
}

/** Resuelve una variable de interés compuesto a partir de las otras tres. */
export function solveCompoundInterest(
  inputs: CompoundInterestInputs,
  unknown: CompoundInterestVariable,
): FinancialResult<CompoundInterestVariable> {
  const knownVariables = (['presentValue', 'futureValue', 'rate', 'periods'] as const)
    .filter((variable) => variable !== unknown)

  for (const variable of knownVariables) {
    if (inputs[variable] === undefined) {
      throw new FinancialInputError(`Falta el dato requerido: ${variable}.`)
    }
    assertFinite(inputs[variable]!, variable)
  }

  const { presentValue, futureValue, rate, periods } = inputs
  let value: number

  switch (unknown) {
    case 'presentValue':
      assertFinitePositive(futureValue!, 'El valor futuro')
      if (rate! <= -1) throw new FinancialInputError('La tasa efectiva debe ser mayor que -100 %.')
      assertFinitePositive(periods!, 'El número de periodos')
      value = futureValue! / (1 + rate!) ** periods!
      break
    case 'futureValue':
      assertFinitePositive(presentValue!, 'El valor presente')
      if (rate! <= -1) throw new FinancialInputError('La tasa efectiva debe ser mayor que -100 %.')
      assertFinitePositive(periods!, 'El número de periodos')
      value = presentValue! * (1 + rate!) ** periods!
      break
    case 'rate':
      assertFinitePositive(presentValue!, 'El valor presente')
      assertFinitePositive(futureValue!, 'El valor futuro')
      assertFinitePositive(periods!, 'El número de periodos')
      value = (futureValue! / presentValue!) ** (1 / periods!) - 1
      break
    case 'periods':
      assertFinitePositive(presentValue!, 'El valor presente')
      assertFinitePositive(futureValue!, 'El valor futuro')
      if (rate! <= -1 || rate === 0) {
        throw new FinancialInputError('La tasa debe ser distinta de cero y mayor que -100 % para despejar periodos.')
      }
      if (futureValue! / presentValue! <= 0) {
        throw new FinancialInputError('La relación entre valor futuro y presente debe ser positiva.')
      }
      value = Math.log(futureValue! / presentValue!) / Math.log(1 + rate!)
      break
  }

  if (!Number.isFinite(value)) {
    throw new FinancialInputError('Los datos ingresados no producen un resultado financiero válido.')
  }

  const units: Record<CompoundInterestVariable, string> = {
    presentValue: 'unidades monetarias',
    futureValue: 'unidades monetarias',
    rate: 'tasa efectiva por periodo (decimal)',
    periods: 'periodos',
  }

  return { variable: unknown, value, unit: units[unknown], formula: formulas[unknown] }
}
