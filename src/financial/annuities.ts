import { assertFinite, assertFinitePositive, FinancialInputError } from './errors'
import type { AnnuityInputs, AnnuityVariable, FinancialResult } from './types'

type AnnuityTiming = 'ordinary' | 'due'

function annuityFactor(rate: number, periods: number, timing: AnnuityTiming): number {
  if (rate === 0) return periods
  const ordinaryFactor = (1 - (1 + rate) ** -periods) / rate
  return timing === 'due' ? ordinaryFactor * (1 + rate) : ordinaryFactor
}

function accumulationFactor(rate: number, periods: number, timing: AnnuityTiming): number {
  if (rate === 0) return periods
  const ordinaryFactor = ((1 + rate) ** periods - 1) / rate
  return timing === 'due' ? ordinaryFactor * (1 + rate) : ordinaryFactor
}

/** Resuelve VP, VF, cuota o periodos para anualidades vencidas/anticipadas. */
export function solveAnnuity(
  inputs: AnnuityInputs,
  unknown: AnnuityVariable,
  timing: AnnuityTiming,
): FinancialResult<AnnuityVariable> {
  const requiredVariables: Record<AnnuityVariable, (keyof AnnuityInputs)[]> = {
    presentValue: ['payment', 'rate', 'periods'],
    futureValue: ['payment', 'rate', 'periods'],
    payment: ['rate', 'periods'],
    periods: ['payment', 'rate'],
  }
  const knownVariables = requiredVariables[unknown]

  for (const variable of knownVariables) {
    if (inputs[variable] === undefined) {
      throw new FinancialInputError(`Falta el dato requerido: ${variable}.`)
    }
    assertFinite(inputs[variable]!, variable)
  }

  const { payment, rate, periods, presentValue, futureValue } = inputs
  const annuityName = timing === 'ordinary' ? 'vencida' : 'anticipada'
  let value: number
  let formula: string

  switch (unknown) {
    case 'presentValue':
      assertFinitePositive(payment!, 'La cuota')
      assertFinitePositive(periods!, 'El número de periodos')
      if (rate! <= -1) throw new FinancialInputError('La tasa efectiva por periodo debe ser mayor que -100 %.')
      value = payment! * annuityFactor(rate!, periods!, timing)
      formula = timing === 'ordinary'
        ? 'VP = A × [1 − (1 + i)⁻ⁿ] / i'
        : 'VP = A × [1 − (1 + i)⁻ⁿ] / i × (1 + i)'
      break
    case 'futureValue':
      assertFinitePositive(payment!, 'La cuota')
      assertFinitePositive(periods!, 'El número de periodos')
      if (rate! <= -1) throw new FinancialInputError('La tasa efectiva por periodo debe ser mayor que -100 %.')
      value = payment! * accumulationFactor(rate!, periods!, timing)
      formula = timing === 'ordinary'
        ? 'VF = A × [(1 + i)ⁿ − 1] / i'
        : 'VF = A × [(1 + i)ⁿ − 1] / i × (1 + i)'
      break
    case 'payment':
      assertFinitePositive(periods!, 'El número de periodos')
      if (rate! <= -1) throw new FinancialInputError('La tasa efectiva por periodo debe ser mayor que -100 %.')
      if (presentValue !== undefined && futureValue !== undefined) {
        throw new FinancialInputError('Para calcular la cuota, ingresa solo valor presente o valor futuro, no ambos.')
      }
      if (presentValue !== undefined) {
        assertFinitePositive(presentValue, 'El valor presente')
        value = presentValue / annuityFactor(rate!, periods!, timing)
        formula = timing === 'ordinary'
          ? 'A = VP × i / [1 − (1 + i)⁻ⁿ]'
          : 'A = VP × i / ([1 − (1 + i)⁻ⁿ] × (1 + i))'
      } else if (futureValue !== undefined) {
        assertFinitePositive(futureValue, 'El valor futuro')
        value = futureValue / accumulationFactor(rate!, periods!, timing)
        formula = timing === 'ordinary'
          ? 'A = VF × i / [(1 + i)ⁿ − 1]'
          : 'A = VF × i / ([(1 + i)ⁿ − 1] × (1 + i))'
      } else {
        throw new FinancialInputError('Para calcular la cuota se requiere valor presente o valor futuro.')
      }
      break
    case 'periods':
      assertFinitePositive(payment!, 'La cuota')
      if (rate! < 0) {
        throw new FinancialInputError('Para despejar periodos, la tasa debe ser igual o mayor que cero.')
      }
      if (rate === 0) {
        if (presentValue !== undefined && futureValue !== undefined) {
          throw new FinancialInputError('Para calcular periodos, ingresa VP o VF, no ambos.')
        }
        const amount = presentValue ?? futureValue
        if (amount === undefined) throw new FinancialInputError('Ingresa VP o VF para calcular los periodos.')
        assertFinitePositive(amount, presentValue !== undefined ? 'El valor presente' : 'El valor futuro')
        value = amount / payment!
        formula = 'n = VP / A (i = 0) o n = VF / A (i = 0)'
      } else if (presentValue !== undefined && futureValue !== undefined) {
        throw new FinancialInputError('Para calcular periodos, ingresa VP o VF, no ambos.')
      } else if (presentValue !== undefined) {
        assertFinitePositive(presentValue, 'El valor presente')
        const ratio = presentValue * rate! / (payment! * (timing === 'due' ? 1 + rate! : 1))
        if (ratio <= 0 || ratio >= 1) {
          throw new FinancialInputError('No existe un número finito de periodos para esos datos de valor presente.')
        }
        value = -Math.log(1 - ratio) / Math.log(1 + rate!)
        formula = 'n = −ln(1 − VP × i / A) / ln(1 + i)'
      } else if (futureValue !== undefined) {
        assertFinitePositive(futureValue, 'El valor futuro')
        const ratio = futureValue * rate! / (payment! * (timing === 'due' ? 1 + rate! : 1))
        value = Math.log(1 + ratio) / Math.log(1 + rate!)
        formula = 'n = ln(1 + VF × i / A) / ln(1 + i)'
      } else {
        throw new FinancialInputError('Para calcular periodos se requiere valor presente o valor futuro.')
      }
      break
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw new FinancialInputError('Los datos ingresados no producen un resultado financiero válido.')
  }

  return {
    variable: unknown,
    value,
    unit: unknown === 'periods' ? 'periodos' : 'unidades monetarias',
    formula: `${annuityName}: ${formula}`,
  }
}

export function solveOrdinaryAnnuity(
  inputs: AnnuityInputs,
  unknown: AnnuityVariable,
): FinancialResult<AnnuityVariable> {
  return solveAnnuity(inputs, unknown, 'ordinary')
}

export function solveAnnuityDue(
  inputs: AnnuityInputs,
  unknown: AnnuityVariable,
): FinancialResult<AnnuityVariable> {
  return solveAnnuity(inputs, unknown, 'due')
}
