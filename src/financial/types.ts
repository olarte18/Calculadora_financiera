/** Un periodo de tasa representado por su cantidad de periodos en un año. */
export interface Rate {
  /** Tasa en forma decimal: 0.12 representa 12 %. */
  value: number
  /** Frecuencia de la tasa o de capitalización por año. */
  periodsPerYear: number
  /** effective: tasa efectiva por periodo; nominal: tasa nominal anual. */
  type: 'effective' | 'nominal'
  /** Las tasas nominales pueden cotizarse vencidas o anticipadas. */
  timing?: 'vencida' | 'anticipada'
}

export interface RateConversionTarget {
  type: Rate['type']
  periodsPerYear: number
  timing?: Rate['timing']
}

export interface FinancialResult<TVariable extends string = string> {
  variable: TVariable
  value: number
  unit: string
  formula: string
}

export type CompoundInterestVariable = 'presentValue' | 'futureValue' | 'rate' | 'periods'

export interface CompoundInterestInputs {
  presentValue?: number
  futureValue?: number
  /** Tasa efectiva por periodo. */
  rate?: number
  periods?: number
}

export type AnnuityVariable = 'presentValue' | 'futureValue' | 'payment' | 'periods'

export interface AnnuityInputs {
  /** Pagos iguales al final o al inicio de cada periodo, según el tipo. */
  payment?: number
  /** Tasa efectiva por periodo. */
  rate?: number
  periods?: number
  presentValue?: number
  futureValue?: number
}

export type PerpetuityVariable = 'capital' | 'payment'

export interface PerpetuityInputs {
  /** Tasa efectiva por periodo, estrictamente positiva. */
  rate: number
  capital?: number
  payment?: number
}
