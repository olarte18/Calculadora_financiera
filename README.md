# Calculadora financiera

Aplicación web para apoyar cálculos de Ingeniería Económica. Se desarrollará con React, Vite y TypeScript, separando la interfaz del motor financiero.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

## Verificación de compilación

```bash
npm run build
npm test
```

## Estructura

- `src/components/`: componentes visuales reutilizables.
- `src/features/`: módulos de la aplicación organizados por funcionalidad.
- `src/financial/`: fórmulas y lógica financiera independiente de la interfaz.
- `src/styles/`: estilos globales.

## Motor financiero

Las tasas se representan como decimales (`0.12` equivale a 12 %). El motor distingue tasas efectivas por periodo y nominales anuales vencidas o anticipadas, y reporta resultados con su variable, unidad y fórmula.

Está implementado el cálculo de interés compuesto para despejar valor presente, valor futuro, tasa efectiva periódica y número de periodos. También están disponibles las conversiones a efectiva anual/periódica, la suma aritmética de tasas nominales compatibles y la composición de tasas efectivas.

La conversión de una tasa nominal anticipada primero obtiene el descuento del periodo y luego lo convierte a tasa efectiva vencida mediante `i = d / (1 - d)`. Las convenciones de indexación se mantienen provisionales hasta confirmar el procedimiento del curso.
