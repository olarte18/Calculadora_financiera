export { solveAnnuity, solveAnnuityDue, solveOrdinaryAnnuity } from './annuities'
export { solveCompoundInterest } from './compoundInterest'
export { FinancialInputError } from './errors'
export {
  addNominalRates,
  combineEffectiveRates,
  convertRate,
  indexWithDtf,
  indexWithEffectiveReference,
  indexWithInflation,
  toEffectiveAnnual,
  toEffectivePeriodic,
} from './rates'
export { solvePerpetuity } from './perpetuity'
export type {
  AnnuityInputs,
  AnnuityVariable,
  CompoundInterestInputs,
  CompoundInterestVariable,
  FinancialResult,
  PerpetuityInputs,
  PerpetuityVariable,
  Rate,
  RateConversionTarget,
} from './types'
