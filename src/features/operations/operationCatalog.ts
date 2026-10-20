export interface OperationDefinition {
  id: string
  label: string
  icon: string
}

export interface OperationGroup {
  title: string
  operations: OperationDefinition[]
}

export const operationGroups: OperationGroup[] = [
  {
    title: 'Valor del dinero en el tiempo',
    operations: [
      { id: 'compound-interest', label: 'Interés compuesto', icon: '↗' },
      { id: 'rate-conversion', label: 'Conversión de tasas', icon: '%' },
      { id: 'indexed-rates', label: 'Tasas indexadas', icon: '⌁' },
    ],
  },
  {
    title: 'Anualidades',
    operations: [
      { id: 'ordinary-annuity', label: 'Anualidad vencida', icon: '◷' },
      { id: 'annuity-due', label: 'Anualidad anticipada', icon: '◴' },
      { id: 'perpetuity', label: 'Anualidad perpetua', icon: '∞' },
    ],
  },
]
