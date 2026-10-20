import { describe, expect, it } from 'vitest'
import {
  addNominalRates,
  combineEffectiveRates,
  convertRate,
  FinancialInputError,
  indexWithDtf,
  indexWithEffectiveReference,
  indexWithInflation,
  solveAnnuityDue,
  solveCompoundInterest,
  solveOrdinaryAnnuity,
  solvePerpetuity,
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

  it('convierte EA a nominal anual vencida según la periodicidad elegida', () => {
    const annualRate: Rate = { value: 0.12, periodsPerYear: 1, type: 'effective' }
    const converted = convertRate(annualRate, {
      type: 'nominal',
      timing: 'vencida',
      periodsPerYear: 12,
    })
    expect(converted.value).toBeCloseTo(12 * (1.12 ** (1 / 12) - 1))
  })

  it('convierte EA a nominal anticipada mediante descuento periódico', () => {
    const annualRate: Rate = { value: 0.12, periodsPerYear: 1, type: 'effective' }
    const monthlyEffective = 1.12 ** (1 / 12) - 1
    const converted = convertRate(annualRate, {
      type: 'nominal',
      timing: 'anticipada',
      periodsPerYear: 12,
    })
    expect(converted.value).toBeCloseTo(12 * (monthlyEffective / (1 + monthlyEffective)))
  })

  it('convierte una nominal anticipada a vencida y recupera la anticipada', () => {
    const nominalAnticipada: Rate = {
      value: 0.24,
      periodsPerYear: 4,
      type: 'nominal',
      timing: 'anticipada',
    }
    const nominalVencida = convertRate(nominalAnticipada, {
      type: 'nominal',
      timing: 'vencida',
      periodsPerYear: 4,
    })
    expect(nominalVencida.value).toBeCloseTo(4 * (0.06 / (1 - 0.06)))

    const convertedBack = convertRate(nominalVencida, {
      type: 'nominal',
      timing: 'anticipada',
      periodsPerYear: 4,
    })
    expect(convertedBack.value).toBeCloseTo(0.24)
  })

  it('convierte nominal vencida a efectiva y viceversa', () => {
    const nominal: Rate = { value: 0.18, periodsPerYear: 12, type: 'nominal', timing: 'vencida' }
    const effectiveAnnual = toEffectiveAnnual(nominal)
    const convertedBack = convertRate(
      { value: effectiveAnnual, periodsPerYear: 1, type: 'effective' },
      { type: 'nominal', timing: 'vencida', periodsPerYear: 12 },
    )
    expect(convertedBack.value).toBeCloseTo(nominal.value)
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

describe('anualidades', () => {
  it('calcula VP y VF de una anualidad vencida', () => {
    const presentValue = solveOrdinaryAnnuity(
      { payment: 100, rate: 0.1, periods: 3 },
      'presentValue',
    ).value
    const futureValue = solveOrdinaryAnnuity(
      { payment: 100, rate: 0.1, periods: 3 },
      'futureValue',
    ).value

    expect(presentValue).toBeCloseTo(100 * (1 - 1.1 ** -3) / 0.1)
    expect(futureValue).toBeCloseTo(100 * (1.1 ** 3 - 1) / 0.1)
  })

  it('calcula VP y VF de una anualidad anticipada', () => {
    const duePresentValue = solveAnnuityDue(
      { payment: 100, rate: 0.1, periods: 3 },
      'presentValue',
    ).value
    const dueFutureValue = solveAnnuityDue(
      { payment: 100, rate: 0.1, periods: 3 },
      'futureValue',
    ).value
    const ordinaryPresentValue = solveOrdinaryAnnuity(
      { payment: 100, rate: 0.1, periods: 3 },
      'presentValue',
    ).value
    const ordinaryFutureValue = solveOrdinaryAnnuity(
      { payment: 100, rate: 0.1, periods: 3 },
      'futureValue',
    ).value

    expect(duePresentValue).toBeCloseTo(ordinaryPresentValue * 1.1)
    expect(dueFutureValue).toBeCloseTo(ordinaryFutureValue * 1.1)
  })

  it('recupera cuota y periodos de una anualidad vencida', () => {
    const futureValue = solveOrdinaryAnnuity(
      { payment: 250, rate: 0.08, periods: 6 },
      'futureValue',
    ).value

    expect(solveOrdinaryAnnuity(
      { futureValue, rate: 0.08, periods: 6 },
      'payment',
    ).value).toBeCloseTo(250)
    expect(solveOrdinaryAnnuity(
      { futureValue, payment: 250, rate: 0.08 },
      'periods',
    ).value).toBeCloseTo(6)
  })

  it('recupera cuota y periodos de una anualidad anticipada', () => {
    const presentValue = solveAnnuityDue(
      { payment: 250, rate: 0.08, periods: 6 },
      'presentValue',
    ).value

    expect(solveAnnuityDue(
      { presentValue, rate: 0.08, periods: 6 },
      'payment',
    ).value).toBeCloseTo(250)
    expect(solveAnnuityDue(
      { presentValue, payment: 250, rate: 0.08 },
      'periods',
    ).value).toBeCloseTo(6)
  })

  it('usa la suma de pagos cuando la tasa periódica es cero', () => {
    expect(solveOrdinaryAnnuity(
      { payment: 50, rate: 0, periods: 4 },
      'presentValue',
    ).value).toBeCloseTo(200)
    expect(solveAnnuityDue(
      { futureValue: 200, payment: 50, rate: 0 },
      'periods',
    ).value).toBeCloseTo(4)
  })

  it('rechaza despejar periodos con un VP inalcanzable', () => {
    expect(() => solveOrdinaryAnnuity(
      { payment: 100, presentValue: 1000, rate: 0.1 },
      'periods',
    )).toThrow(FinancialInputError)
  })
})

describe('perpetuidad', () => {
  it('calcula el capital requerido y el pago sostenible', () => {
    expect(solvePerpetuity({ payment: 100, rate: 0.05 }, 'capital').value).toBeCloseTo(2000)
    expect(solvePerpetuity({ capital: 2000, rate: 0.05 }, 'payment').value).toBeCloseTo(100)
  })

  it('rechaza una tasa nula o negativa', () => {
    expect(() => solvePerpetuity({ payment: 100, rate: 0 }, 'capital')).toThrow(FinancialInputError)
  })
})

describe('indexación', () => {
  it('indexa DTF sumando nominalmente base y puntos', () => {
    const result = indexWithDtf(
      { value: 0.1, periodsPerYear: 4, type: 'nominal', timing: 'anticipada' },
      { value: 0.02, periodsPerYear: 4, type: 'nominal', timing: 'anticipada' },
    )
    expect(result.value).toBeCloseTo(0.12)
  })

  it('compone una base EA con referencia efectiva mensual', () => {
    const result = indexWithEffectiveReference(
      { value: 0.1, periodsPerYear: 1, type: 'effective' },
      { value: 0.01, periodsPerYear: 12, type: 'effective' },
    )
    expect(result.value).toBeCloseTo(1.1 * 1.01 ** 12 - 1)
  })

  it('indexa por inflación componiendo la tasa real y la variación del IPC', () => {
    const result = indexWithInflation(
      { value: 0.05, periodsPerYear: 1, type: 'effective' },
      { value: 0.08, periodsPerYear: 1, type: 'effective' },
    )
    expect(result.value).toBeCloseTo(1.05 * 1.08 - 1)
  })
})
