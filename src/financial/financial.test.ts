import { describe, expect, it } from 'vitest'
import {
  addNominalRates,
  combineEffectiveRates,
  FinancialInputError,
  solveCompoundInterest,
  toEffectiveAnnual,
  toEffectivePeriodic,
} from './index'
import type { Rate } from './types'

describe('conversión de tasas', () => {
  it('convierte una tasa nominal anual vencida a efectiva anual', () => {
    const rate: Rate = { value: 0.24, periodsPerYear: 12, type: 'nominal', timing: 'vencida' }
    expect(toEffectiveAnnual(rate)).toBeCloseTo((1 + 0.24 / 12) ** 12 - 1)
  })

  it('convierte una tasa nominal anticipada considerando el descuento', () => {
    const rate: Rate = { value: 0.24, periodsPerYear: 4, type: 'nominal', timing: 'anticipada' }
    expect(toEffectiveAnnual(rate)).toBeCloseTo((1 / (1 - 0.24 / 4)) ** 4 - 1)
  })

  it('convierte una tasa EA a efectiva mensual', () => {
    const annualRate: Rate = { value: 0.12, periodsPerYear: 1, type: 'effective' }
    expect(toEffectivePeriodic(annualRate, 12)).toBeCloseTo(1.12 ** (1 / 12) - 1)
  })

  it('combina tasas efectivas mediante composición', () => {
    const combined = combineEffectiveRates(
      { value: 0.1, periodsPerYear: 1, type: 'effective' },
      { value: 0.05, periodsPerYear: 1, type: 'effective' },
    )
    expect(combined.value).toBeCloseTo(0.155)
    expect(combined.periodsPerYear).toBe(1)
  })

  it('suma aritméticamente tasas nominales compatibles', () => {
    const base: Rate = { value: 0.1, periodsPerYear: 4, type: 'nominal', timing: 'anticipada' }
    const spread: Rate = { value: 0.02, periodsPerYear: 4, type: 'nominal', timing: 'anticipada' }
    expect(addNominalRates(base, spread).value).toBeCloseTo(0.12)
  })

  it('rechaza sumar tasas nominales de periodicidades distintas', () => {
    const annual: Rate = { value: 0.1, periodsPerYear: 4, type: 'nominal', timing: 'anticipada' }
    const monthly: Rate = { value: 0.02, periodsPerYear: 12, type: 'nominal', timing: 'anticipada' }
    expect(() => addNominalRates(annual, monthly)).toThrow(FinancialInputError)
  })
})

describe('interés compuesto', () => {
  it('calcula el valor futuro', () => {
    expect(solveCompoundInterest(
      { presentValue: 1000, rate: 0.1, periods: 3 },
      'futureValue',
    ).value).toBeCloseTo(1331)
  })

  it('calcula el valor presente', () => {
    expect(solveCompoundInterest(
      { futureValue: 1331, rate: 0.1, periods: 3 },
      'presentValue',
    ).value).toBeCloseTo(1000)
  })

  it('calcula la tasa efectiva periódica', () => {
    expect(solveCompoundInterest(
      { presentValue: 1000, futureValue: 1331, periods: 3 },
      'rate',
    ).value).toBeCloseTo(0.1)
  })

  it('calcula el número de periodos', () => {
    expect(solveCompoundInterest(
      { presentValue: 1000, futureValue: 1331, rate: 0.1 },
      'periods',
    ).value).toBeCloseTo(3)
  })

  it('rechaza una tasa cero al despejar periodos', () => {
    expect(() => solveCompoundInterest(
      { presentValue: 1000, futureValue: 1200, rate: 0 },
      'periods',
    )).toThrow(FinancialInputError)
  })
})
