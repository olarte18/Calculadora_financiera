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

## Uso de la calculadora

En el panel izquierdo selecciona una operación y luego indica la incógnita. Ingresa los valores solicitados junto con la periodicidad correspondiente y pulsa **Calcular resultado**. El resultado muestra la variable calculada, sus unidades y la fórmula aplicada. Para montos se puede elegir COP, USD o EUR.

En interés compuesto y anualidades, la tasa se ingresa como efectiva por periodo y el periodo debe coincidir con la frecuencia seleccionada. En conversión de tasas se indica el tipo de origen y destino (efectiva por periodo, nominal anual vencida o nominal anual anticipada), su modalidad y las periodicidades de capitalización.

## Motor financiero

Las tasas se representan como decimales (`0.12` equivale a 12 %). El motor distingue tasas efectivas por periodo y nominales anuales vencidas o anticipadas, y reporta resultados con su variable, unidad y fórmula.

Está implementado el cálculo de interés compuesto para despejar valor presente, valor futuro, tasa efectiva periódica y número de periodos; anualidades vencidas y anticipadas para despejar VP, VF, cuota o periodos; y perpetuidades para calcular capital o pago sostenible. También están disponibles las conversiones a efectiva anual/periódica, la suma aritmética de tasas nominales compatibles y la composición de tasas efectivas.

La conversión de una tasa nominal anticipada primero obtiene el descuento del periodo y luego lo convierte a tasa efectiva vencida mediante `iv = d / (1 - d)`. Para convertir una efectiva vencida a anticipada se usa `d = iv / (1 + iv)`. Las fórmulas se aplican internamente con tasas decimales; la interfaz recibe y muestra porcentajes. La fuente académica incorporada al repositorio es [`formulas_de_ingenier_a_econ_mica.md`](./formulas_de_ingenier_a_econ_mica.md).

Para indexación se aplican los supuestos acordados: DTF TA más puntos por suma aritmética; IBR e IPC por composición de factores efectivos anuales; UVR según la variación anual del IPC. Estas convenciones deben contrastarse con las indicaciones definitivas del curso.
