import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  indexWithDtf,
  indexWithEffectiveReference,
  indexWithInflation,
  solveAnnuityDue,
  solveCompoundInterest,
  solveOrdinaryAnnuity,
  solvePerpetuity,
  toEffectiveAnnual,
  toEffectivePeriodic,
  FinancialInputError,
} from '../../financial'
import type {
  AnnuityVariable,
  CompoundInterestVariable,
  FinancialResult,
  PerpetuityVariable,
  Rate,
} from '../../financial'
import { operationGroups } from '../operations/operationCatalog'

type FieldValues = Record<string, string>
type Frequency = 1 | 2 | 4 | 6 | 12 | 24 | 52 | 360

const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: 1, label: 'Anual (1)' },
  { value: 2, label: 'Semestral (2)' },
  { value: 4, label: 'Trimestral (4)' },
  { value: 6, label: 'Bimestral (6)' },
  { value: 12, label: 'Mensual (12)' },
  { value: 24, label: 'Quincenal (24)' },
  { value: 52, label: 'Semanal (52)' },
  { value: 360, label: 'Diaria, año comercial (360)' },
]

const compoundVariables: { value: CompoundInterestVariable; label: string }[] = [
  { value: 'presentValue', label: 'Valor presente (VP)' },
  { value: 'futureValue', label: 'Valor futuro (VF)' },
  { value: 'rate', label: 'Tasa efectiva por periodo (i)' },
  { value: 'periods', label: 'Número de periodos (n)' },
]

const annuityVariables: { value: AnnuityVariable; label: string }[] = [
  { value: 'presentValue', label: 'Valor presente (VP)' },
  { value: 'futureValue', label: 'Valor futuro (VF)' },
  { value: 'payment', label: 'Cuota periódica (A)' },
  { value: 'periods', label: 'Número de periodos (n)' },
]

const perpetuityVariables: { value: PerpetuityVariable; label: string }[] = [
  { value: 'capital', label: 'Capital requerido (C)' },
  { value: 'payment', label: 'Pago sostenible (A)' },
]

const variableLabels: Record<string, string> = {
  presentValue: 'Valor presente',
  futureValue: 'Valor futuro',
  rate: 'Tasa efectiva por periodo',
  periods: 'Número de periodos',
  payment: 'Cuota periódica',
  capital: 'Capital requerido',
  indexedRate: 'Tasa indexada',
}

function numberValue(values: FieldValues, key: string, label: string): number {
  const raw = values[key]?.trim().replace(',', '.')
  if (!raw) throw new FinancialInputError(`Ingresa ${label.toLowerCase()}.`)
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) throw new FinancialInputError(`${label} debe ser un número válido.`)
  return parsed
}

function frequencyValue(values: FieldValues, key: string): Frequency {
  return Number(values[key] ?? 1) as Frequency
}

function rate(value: number, periodsPerYear: number, type: Rate['type'] = 'effective', timing?: Rate['timing']): Rate {
  return { value, periodsPerYear, type, ...(timing ? { timing } : {}) }
}

function moneyFormatter(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  })
}

interface Props {
  operationId: string
  onClose: () => void
}

export function OperationCalculator({ operationId, onClose }: Props) {
  const operation = useMemo(
    () => operationGroups.flatMap((group) => group.operations).find((item) => item.id === operationId),
    [operationId],
  )
  const isCompound = operationId === 'compound-interest'
  const isConversion = operationId === 'rate-conversion'
  const isIndexed = operationId === 'indexed-rates'
  const isOrdinary = operationId === 'ordinary-annuity'
  const isDue = operationId === 'annuity-due'
  const isPerpetuity = operationId === 'perpetuity'

  const [unknown, setUnknown] = useState<string>(
    isCompound ? 'futureValue' : isPerpetuity ? 'capital' : 'presentValue',
  )
  const [values, setValues] = useState<FieldValues>({
    periodsPerYear: '12',
    amountType: 'presentValue',
    currency: 'COP',
    rateType: 'effective',
    rateTiming: 'vencida',
    sourcePeriods: '1',
    targetPeriods: '12',
    indexType: 'IPC',
    dtfPeriods: '4',
    currencyCode: 'COP',
  })
  const [result, setResult] = useState<FinancialResult | null>(null)
  const [extraResult, setExtraResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!operation) return null

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setResult(null)
    setExtraResult(null)
    setError(null)
  }

  const currentVariables = isCompound
    ? compoundVariables
    : isPerpetuity
      ? perpetuityVariables
      : annuityVariables
  const currency = values.currencyCode ?? 'COP'
  const formatMoney = moneyFormatter(currency)

  const numberField = (
    key: string,
    label: string,
    unit: string,
    options: { min?: number; placeholder?: string; required?: boolean } = {},
  ) => (
    <label className="form-field" key={key}>
      <span className="field-label">{label}</span>
      <span className="input-with-unit">
        <input
          aria-label={label}
          min={options.min}
          onChange={(event) => setValue(key, event.target.value)}
          placeholder={options.placeholder ?? '0'}
          required={options.required ?? true}
          step="any"
          type="number"
          value={values[key] ?? ''}
        />
        <span>{unit}</span>
      </span>
    </label>
  )

  const selectField = (key: string, label: string, options: { value: string; label: string }[]) => (
    <label className="form-field" key={key}>
      <span className="field-label">{label}</span>
      <select aria-label={label} onChange={(event) => setValue(key, event.target.value)} value={values[key] ?? options[0]?.value}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )

  const frequencyField = (key: string, label: string) => selectField(
    key,
    label,
    frequencyOptions.map((option) => ({ value: String(option.value), label: option.label })),
  )

  const moneyUnit = currency
  const percentageField = (key: string, label: string, placeholder = 'Ej. 12') => numberField(key, label, '%', { placeholder })

  const renderFields = (): ReactNode => {
    if (isCompound) {
      const fields: ReactNode[] = [frequencyField('periodsPerYear', 'Periodicidad de tasa y tiempo')]
      if (unknown !== 'presentValue') fields.push(numberField('presentValue', 'Valor presente', moneyUnit, { min: 0 }))
      if (unknown !== 'futureValue') fields.push(numberField('futureValue', 'Valor futuro', moneyUnit, { min: 0 }))
      if (unknown !== 'rate') fields.push(percentageField('rate', 'Tasa efectiva por periodo'))
      if (unknown !== 'periods') fields.push(numberField('periods', 'Número de periodos', 'periodos', { min: 0 }))
      return fields
    }

    if (isOrdinary || isDue) {
      const amountType = values.amountType ?? 'presentValue'
      const fields: ReactNode[] = [frequencyField('periodsPerYear', 'Periodicidad de pagos y tasa')]
      if (unknown !== 'payment') fields.push(numberField('payment', 'Cuota periódica', moneyUnit, { min: 0 }))
      if (unknown !== 'periods') fields.push(percentageField('rate', 'Tasa efectiva por periodo'))
      if (unknown === 'payment' || unknown === 'periods') {
        fields.push(selectField('amountType', 'Dato de valor conocido', [
          { value: 'presentValue', label: 'Valor presente (VP)' },
          { value: 'futureValue', label: 'Valor futuro (VF)' },
        ]))
        fields.push(numberField(amountType, amountType === 'presentValue' ? 'Valor presente' : 'Valor futuro', moneyUnit, { min: 0 }))
      }
      if (unknown !== 'periods') fields.push(numberField('periods', 'Número de periodos', 'periodos', { min: 0 }))
      return fields
    }

    if (isPerpetuity) {
      const fields: ReactNode[] = [frequencyField('periodsPerYear', 'Periodicidad del pago y la tasa')]
      fields.push(percentageField('rate', 'Tasa efectiva por periodo'))
      if (unknown === 'capital') fields.push(numberField('payment', 'Pago periódico', moneyUnit, { min: 0 }))
      else fields.push(numberField('capital', 'Capital disponible', moneyUnit, { min: 0 }))
      return fields
    }

    if (isConversion) {
      return [
        percentageField('sourceRate', 'Tasa de origen'),
        selectField('rateType', 'Tipo de tasa de origen', [
          { value: 'effective', label: 'Efectiva por periodo' },
          { value: 'nominalVencida', label: 'Nominal anual vencida (MV, TV, etc.)' },
          { value: 'nominalAnticipada', label: 'Nominal anual anticipada (MA, TA, etc.)' },
        ]),
        frequencyField('sourcePeriods', 'Periodicidad de origen / capitalización'),
        frequencyField('targetPeriods', 'Periodicidad efectiva de destino'),
      ]
    }

    const indexType = values.indexType ?? 'IPC'
    const commonFields: ReactNode[] = [selectField('indexType', 'Indicador de indexación', [
      { value: 'DTF', label: 'DTF: suma nominal TA' },
      { value: 'IBR', label: 'IBR: composición efectiva EA' },
      { value: 'IPC', label: 'IPC: composición efectiva EA' },
      { value: 'UVR', label: 'UVR: variación del IPC' },
    ])]
    if (indexType === 'DTF') {
      commonFields.push(percentageField('baseRate', 'DTF (nominal anual TA)'))
      commonFields.push(percentageField('spread', 'Puntos adicionales (nominal anual TA)'))
      commonFields.push(<p className="field-hint" key="dtf-hint">Las tasas TA se suman aritméticamente y luego se convierten a efectiva anual.</p>)
    } else if (indexType === 'UVR') {
      commonFields.push(percentageField('ipcRate', 'Variación anual del IPC (EA)'))
      commonFields.push(<p className="field-hint" key="uvr-hint">La UVR se ajusta exclusivamente por la variación del IPC; se informa esa tasa sin agregar margen.</p>)
    } else {
      commonFields.push(percentageField('baseRate', 'Tasa base efectiva anual (EA)'))
      commonFields.push(percentageField(indexType === 'IPC' ? 'ipcRate' : 'referenceRate', indexType === 'IPC' ? 'Variación del IPC (EA)' : 'Tasa IBR efectiva anual (EA)'))
      commonFields.push(<p className="field-hint" key="effective-hint">Convención provisional: se multiplican los factores efectivos anuales.</p>)
    }
    return commonFields
  }

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setResult(null)
    setExtraResult(null)

    try {
      let calculation: FinancialResult
      if (isCompound) {
        const inputs: Record<string, number> = {}
        if (unknown !== 'presentValue') inputs.presentValue = numberValue(values, 'presentValue', 'el valor presente')
        if (unknown !== 'futureValue') inputs.futureValue = numberValue(values, 'futureValue', 'el valor futuro')
        if (unknown !== 'rate') inputs.rate = numberValue(values, 'rate', 'la tasa') / 100
        if (unknown !== 'periods') inputs.periods = numberValue(values, 'periods', 'el número de periodos')
        calculation = solveCompoundInterest(inputs, unknown as CompoundInterestVariable)
      } else if (isOrdinary || isDue) {
        const inputs: Record<string, number> = {
          rate: numberValue(values, 'rate', 'la tasa') / 100,
        }
        if (unknown !== 'periods') inputs.periods = numberValue(values, 'periods', 'el número de periodos')
        if (unknown !== 'payment') inputs.payment = numberValue(values, 'payment', 'la cuota')
        if (unknown === 'payment' || unknown === 'periods') {
          const knownAmount = values.amountType ?? 'presentValue'
          inputs[knownAmount] = numberValue(values, knownAmount, knownAmount === 'presentValue' ? 'el valor presente' : 'el valor futuro')
        }
        calculation = isOrdinary
          ? solveOrdinaryAnnuity(inputs, unknown as AnnuityVariable)
          : solveAnnuityDue(inputs, unknown as AnnuityVariable)
      } else if (isPerpetuity) {
        const inputs: { rate: number; payment?: number; capital?: number } = {
          rate: numberValue(values, 'rate', 'la tasa') / 100,
        }
        if (unknown === 'capital') inputs.payment = numberValue(values, 'payment', 'el pago periódico')
        else inputs.capital = numberValue(values, 'capital', 'el capital disponible')
        calculation = solvePerpetuity(inputs, unknown as PerpetuityVariable)
      } else if (isConversion) {
        const type = values.rateType ?? 'effective'
        const sourceFrequency = frequencyValue(values, 'sourcePeriods')
        const inputRate = numberValue(values, 'sourceRate', 'la tasa de origen') / 100
        const sourceRate = type === 'effective'
          ? rate(inputRate, sourceFrequency)
          : rate(inputRate, sourceFrequency, 'nominal', type === 'nominalAnticipada' ? 'anticipada' : 'vencida')
        const targetFrequency = frequencyValue(values, 'targetPeriods')
        const target = toEffectivePeriodic(sourceRate, targetFrequency)
        calculation = {
          variable: 'rate',
          value: target,
          unit: `tasa efectiva ${frequencyOptions.find((option) => option.value === targetFrequency)?.label.split(' (')[0]}`,
          formula: 'iₚ = (1 + iEA)^(1 / m) − 1',
        }
        setExtraResult(`Equivalente efectiva anual: ${new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 6 }).format(toEffectiveAnnual(sourceRate))} EA`)
      } else {
        const indexType = values.indexType ?? 'IPC'
        if (indexType === 'DTF') {
          const indexed = indexWithDtf(
            rate(numberValue(values, 'baseRate', 'la DTF') / 100, 4, 'nominal', 'anticipada'),
            rate(numberValue(values, 'spread', 'los puntos adicionales') / 100, 4, 'nominal', 'anticipada'),
          )
          calculation = {
            variable: 'indexedRate',
            value: indexed.value,
            unit: 'tasa nominal anual anticipada (TA)',
            formula: 'Tasa indexada TA = DTF + puntos adicionales',
          }
          setExtraResult(`Equivalente efectiva anual: ${new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 6 }).format(toEffectiveAnnual(indexed))} EA`)
        } else if (indexType === 'UVR') {
          const ipc = numberValue(values, 'ipcRate', 'la variación del IPC') / 100
          const indexed = indexWithInflation(rate(0, 1), rate(ipc, 1))
          calculation = {
            variable: 'indexedRate',
            value: indexed.value,
            unit: 'variación efectiva anual basada en IPC (EA)',
            formula: 'Variación UVR = variación anual del IPC',
          }
        } else {
          const base = rate(numberValue(values, 'baseRate', 'la tasa base') / 100, 1)
          const reference = indexType === 'IPC'
            ? rate(numberValue(values, 'ipcRate', 'la variación del IPC') / 100, 1)
            : rate(numberValue(values, 'referenceRate', 'la tasa IBR') / 100, 1)
          const indexed = indexType === 'IPC'
            ? indexWithInflation(base, reference)
            : indexWithEffectiveReference(base, reference)
          calculation = {
            variable: 'indexedRate',
            value: indexed.value,
            unit: 'tasa efectiva anual (EA)',
            formula: '(1 + tasa base EA) × (1 + referencia EA) − 1',
          }
        }
      }
      setResult(calculation)
    } catch (calculationError) {
      setError(calculationError instanceof Error ? calculationError.message : 'No fue posible realizar el cálculo.')
    }
  }

  const isRateResult = result?.unit.includes('tasa') || result?.unit.includes('variación')
  const resultDisplay = result
    ? isRateResult
      ? new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 8 }).format(result.value)
      : result.unit.includes('periodos')
        ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 6 }).format(result.value)
        : formatMoney.format(result.value)
    : null

  return (
    <section className="calculator-panel calculator-active" aria-labelledby="calculator-title">
      <div className="calculator-heading">
        <div>
          <p className="eyebrow">Espacio de cálculo</p>
          <h2 id="calculator-title">{operation.label}</h2>
        </div>
        <button className="text-button" onClick={onClose} type="button">Cerrar</button>
      </div>

      <form className="calculator-form" onSubmit={calculate}>
        {!isConversion && !isIndexed && (
          <div className="form-grid form-grid-top">
            <label className="form-field">
              <span className="field-label">Variable que deseas calcular</span>
              <select onChange={(event) => { setUnknown(event.target.value); setResult(null); setError(null) }} value={unknown}>
                {currentVariables.map((variable) => <option key={variable.value} value={variable.value}>{variable.label}</option>)}
              </select>
            </label>
            <label className="form-field currency-field">
              <span className="field-label">Moneda</span>
              <select onChange={(event) => setValue('currencyCode', event.target.value)} value={currency}>
                <option value="COP">COP · Peso colombiano</option>
                <option value="USD">USD · Dólar estadounidense</option>
                <option value="EUR">EUR · Euro</option>
              </select>
            </label>
          </div>
        )}
        <div className="form-grid">{renderFields()}</div>
        <button className="calculate-button" type="submit">Calcular resultado <span aria-hidden="true">→</span></button>
      </form>

      {error && <div className="feedback feedback-error" role="alert">{error}</div>}

      {result && resultDisplay && (
        <div aria-live="polite" className="result-card" role="status">
          <div className="result-topline">
            <span className="result-label">{variableLabels[result.variable] ?? 'Resultado'}</span>
            <span className="result-badge">Resultado calculado</span>
          </div>
          <p className="result-value">{resultDisplay}<span className="result-unit">{result.unit}</span></p>
          {extraResult && <p className="result-extra">{extraResult}</p>}
          <div className="formula-row"><span>Procedimiento</span><code>{result.formula}</code></div>
          {(isCompound || isOrdinary || isDue || isPerpetuity) && (
            <p className="period-note">La tasa ingresada es efectiva por periodo. Verifica que su periodicidad coincida con el tiempo o la frecuencia de pagos.</p>
          )}
        </div>
      )}
    </section>
  )
}
