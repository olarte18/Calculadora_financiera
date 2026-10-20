# Fórmulas de Ingeniería Económica

## 1. Anualidades Vencidas (Pagos al final del periodo)

*   Tiempo ($n$) con Valor Presente ($VP$):
    $$n = \frac{-\ln\left(1 - \frac{VP \cdot i\%}{A}\right)}{\ln(1 + i\%)}$$

*   Tiempo ($n$) con Valor Futuro ($VF$):
    $$n = \frac{\ln\left(\frac{VF \cdot i\%}{A} + 1\right)}{\ln(1 + i\%)}$$

---

## 2. Anualidades Anticipadas (Pagos al inicio del periodo)

*   Tiempo ($n$) con Valor Presente ($VP$):
    $$n = \frac{-\ln\left(1 - \frac{VP \cdot i\%}{A(1+i\%)}\right)}{\ln(1 + i\%)}$$

*   Tiempo ($n$) con Valor Futuro ($VF$):
    $$n = \frac{\ln\left(\frac{VF \cdot i\%}{A(1+i\%)} + 1\right)}{\ln(1 + i\%)}$$

---

## HOJA DE FÓRMULAS – INGENIERÍA ECONÓMICA – EEIE UIS

### Relaciones de Tasas de Interés

*   $i_n = i_p \cdot m$
*   $i_p = \frac{i_n}{m}$

**Interés Nominal a Efectivo:**
*   $i_{ea} = \left[ \left(1 + \frac{i_n}{m}\right)^m - 1 \right] \cdot 100$

**Interés Efectivo a Nominal:**
*   $i_n = \left[ (1 + i_{ea})^{\frac{1}{m}} - 1 \right] \cdot m \cdot 100$

**Interés Periódico a Efectivo y viceversa:**
*   $i_{ea} = \left[ (1 + i_p)^m - 1 \right] \cdot 100$
*   $i_p = \left[ (1 + i_{ea})^{\frac{1}{m}} - 1 \right] \cdot 100$

### Interés Compuesto

*   **Valor Futuro:** 
    $$F = P \cdot (1 + i)^n$$
*   **Valor Presente:** 
    $$P = \frac{F}{(1 + i)^n}$$
*   **Interés:** 
    $$i = \left[ \sqrt[n]{\frac{F}{P}} - 1 \right] \cdot 100$$
*   **Tiempo:** 
    $$n = \frac{\ln\left(\frac{F}{P}\right)}{\ln(1 + i)}$$

### Conversiones y Otras Fórmulas

*   Para convertir de interés vencido a anticipado: 
    $$i_a = \frac{i_v}{1+i_v}$$
*   Para convertir de interés anticipado a vencido: 
    $$i_v = \frac{i_a}{1-i_a}$$
*   Interés Indexado: 
    $$i_{dx} = \left[ (1 + i_1)(1 + i_2) - 1 \right] \cdot 100\%$$

*   **Anualidades Presentes:** 
    $$P = A \left[ \frac{(1+i)^n - 1}{i(1+i)^n} \right] \quad ; \quad A = P \left[ \frac{i(1+i)^n}{(1+i)^n - 1} \right]$$

*   **Anualidades Futuras:** 
    $$F = A \left[ \frac{(1+i)^n - 1}{i} \right] \quad ; \quad A = F \left[ \frac{i}{(1+i)^n - 1} \right]$$

*   **Anualidades Anticipadas Presente:** 
    $$P = A + A \left[ \frac{(1+i)^{n-1} - 1}{i(1+i)^{n-1}} \right] \quad ; \quad A = \frac{P}{1 + \left[ \frac{(1+i)^{n-1} - 1}{i(1+i)^{n-1}} \right]}$$

*   **Anualidades Anticipadas Futuras:** 
    $$F = A \cdot \left[ \frac{(1+i)^{n+1} - (1+i)}{i} \right]$$

*   **Anualidades Perpetuas:** 
    $$P = \frac{A}{i}$$