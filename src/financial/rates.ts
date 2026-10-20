import { FinancialInputError } from './errors'
import type { Rate, RateConversionTarget } from './types'

function validateRate(rate: Rate): void {
  if (!Number.isFinite(rate.value)) {
    throw new FinancialInputError('La tasa debe ser un número válido.')
  }
  if (!Number.isFinite(rate.periodsPerYear) || rate.periodsPerYear <= 0) {
    throw new FinancialInputError('La cantidad de periodos por año debe ser mayor que cero.')
  }
  if (rate.type === 'nominal' && rate.timing === undefined) {
    throw new FinancialInputError('Indica si la tasa nominal es vencida o anticipada.')
  }
}

/** Convierte cualquier tasa admitida a una tasa efectiva anual. */
export function toEffectiveAnnual(rate: Rate): number {
  validateRate(rate)

  if (rate.type === 'effective') {
    if (rate.value <= -1) {
      throw new FinancialInputError('La tasa efectiva por periodo debe ser mayor que -100 %.')
    }
    return (1 + rate.value) ** rate.periodsPerYear - 1
  }

  const nominalPeriodicRate = rate.value / rate.periodsPerYear
  let effectivePeriodicRate = nominalPeriodicRate

  if (rate.timing === 'anticipada') {
    if (nominalPeriodicRate >= 1) {
      throw new FinancialInputError('La tasa anticipada por periodo debe ser menor que 100 %.')
    }
    effectivePeriodicRate = nominalPeriodicRate / (1 - nominalPeriodicRate)
  } else if (nominalPeriodicRate <= -1) {
    throw new FinancialInputError('La tasa nominal vencida por periodo debe ser mayor que -100 %.')
  }

  return (1 + effectivePeriodicRate) ** rate.periodsPerYear - 1
}

/** Convierte una tasa a una efectiva por el periodo de capitalización solicitado. */
export function toEffectivePeriodic(rate: Rate, periodsPerYear: number): number {
  if (!Number.isFinite(periodsPerYear) || periodsPerYear <= 0) {
    throw new FinancialInputError('La periodicidad destino debe ser mayor que cero.')
  }
  return (1 + toEffectiveAnnual(rate)) ** (1 / periodsPerYear) - 1
}

/** Convierte una tasa a efectiva periódica o nominal anual vencida/anticipada. */
export function convertRate(rate: Rate, target: RateConversionTarget): Rate {
  if (!Number.isFinite(target.periodsPerYear) || target.periodsPerYear <= 0) {
    throw new FinancialInputError('La periodicidad destino debe ser mayor que cero.')
  }
  if (target.type === 'nominal' && target.timing === undefined) {
    throw new FinancialInputError('Indica si la tasa nominal destino es vencida o anticipada.')
  }

  const effectiveAnnualRate = toEffectiveAnnual(rate)
  const effectivePeriodicRate = (1 + effectiveAnnualRate) ** (1 / target.periodsPerYear) - 1

  if (target.type === 'effective') {
    return {
      value: effectivePeriodicRate,
      periodsPerYear: target.periodsPerYear,
      type: 'effective',
    }
  }

  const nominalPeriodicRate = target.timing === 'anticipada'
    ? effectivePeriodicRate / (1 + effectivePeriodicRate)
    : effectivePeriodicRate

  return {
    value: nominalPeriodicRate * target.periodsPerYear,
    periodsPerYear: target.periodsPerYear,
    type: 'nominal',
    timing: target.timing,
  }
}

/** Suma aritméticamente cotizaciones nominales con igual periodicidad y modalidad. */
export function addNominalRates(...rates: Rate[]): Rate {
  if (rates.length === 0) {
    throw new FinancialInputError('Ingresa al menos una tasa nominal para sumar.')
  }

  rates.forEach(validateRate)
  const first = rates[0]
  if (first.type !== 'nominal') {
    throw new FinancialInputError('La suma aritmética de indexación requiere tasas nominales.')
  }

  for (const rate of rates) {
    if (
      rate.type !== 'nominal' ||
      rate.periodsPerYear !== first.periodsPerYear ||
      rate.timing !== first.timing
    ) {
      throw new FinancialInputError('Las tasas nominales deben tener la misma periodicidad y modalidad.')
    }
  }

  return {
    value: rates.reduce((sum, rate) => sum + rate.value, 0),
    periodsPerYear: first.periodsPerYear,
    type: 'nominal',
    timing: first.timing,
  }
}

/** Combina factores efectivos con la convención compuesta: (1+i1)(1+i2)-1. */
export function combineEffectiveRates(...rates: Rate[]): Rate {
  if (rates.length === 0) {
    throw new FinancialInputError('Ingresa al menos una tasa efectiva para combinar.')
  }

  const effectiveAnnualRates = rates.map(toEffectiveAnnual)
  const combinedEffectiveAnnualRate = effectiveAnnualRates.reduce(
    (factor, rate) => factor * (1 + rate),
    1,
  ) - 1

  return {
    value: combinedEffectiveAnnualRate,
    periodsPerYear: 1,
    type: 'effective',
  }
}

/** Indexación DTF: suma nominal aritmética de la referencia y el margen. */
export function indexWithDtf(dtf: Rate, spread: Rate): Rate {
  return addNominalRates(dtf, spread)
}

/** Indexación compuesta para IBR u otro índice expresado como tasa efectiva. */
export function indexWithEffectiveReference(baseRate: Rate, referenceRate: Rate): Rate {
  return combineEffectiveRates(baseRate, referenceRate)
}

/** Ajuste por inflación: UVR se basa únicamente en la variación efectiva del IPC. */
export function indexWithInflation(realRate: Rate, ipcVariation: Rate): Rate {
  return combineEffectiveRates(realRate, ipcVariation)
}
