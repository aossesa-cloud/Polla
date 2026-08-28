---
title: 'Agregar puntaje y color para exclusivo en segundo lugar'
type: 'feature'
created: '2026-08-28'
status: 'done'
baseline_commit: '28bb4f8'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** El modo por puntos solo reconoce la exclusividad cuando el caballo pronosticado llega primero. Si un caballo llega segundo y una sola persona lo eligió, actualmente recibe el puntaje y color normales de segundo lugar.

**Approach:** Incorporar la categoría independiente `Exclusivo 2.º`, con puntaje y color configurables por campaña, y propagarla de forma consistente por cálculo, parser, tabla y PNG. El nuevo puntaje sustituye al de segundo lugar; no se suma como bonificación.

## Boundaries & Constraints

**Always:** Un caballo es exclusivo segundo cuando figura segundo —incluido empate en segundo— y solamente una identidad de participante lo pronosticó en esa carrera. Los retiros se sustituyen por el favorito antes de contar selecciones, igual que en exclusivo primero. Cada caballo empatado se evalúa por separado. `exclusiveSecond` es una categoría semántica propia, conserva valores de cero y usa `points.exclusiveSecond` y `pointColors.exclusiveSecond`. Campañas nuevas comienzan con 10 puntos y color `#EC4899`, ambos editables. Campañas antiguas sin el nuevo puntaje usan `points.second`, evitando cambiar sus totales históricos. Exclusivo primero mantiene intactas sus reglas, puntaje y color.

**Ask First:** Convertir el nuevo valor en bonificación acumulable; cambiar cómo se identifica a una persona; aplicar exclusividad al tercer lugar; alterar los valores predeterminados acordados; recalcular o persistir cambios masivos sobre campañas antiguas.

**Never:** Modificar el modo por dividendos, los puntos normales de primero/segundo/tercero, la regla de última carrera doble, empates de otras posiciones o retiros; crear lógica diferente entre frontend y parser; tocar la interfaz antigua no montada de `Campaigns.jsx`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Segundo exclusivo | Solo Ana elige 7 y el 7 llega segundo | Ana recibe `exclusiveSecond`, su puntaje configurado y su color | N/A |
| Segundo compartido | Ana y Beto eligen 7 y el 7 llega segundo | Ambos reciben puntos y color normales de segundo | N/A |
| Empate en segundo | 7 y 8 empatan segundo; 7 tiene una selección y 8 dos | El 7 es exclusivo segundo; el 8 es segundo normal | Evaluar cada caballo independientemente |
| Retiro defendido | Ana elige un retirado, el favorito efectivo llega segundo y nadie más lo eligió | Ana recibe exclusivo segundo | Contar el pick efectivo, no el retirado |
| Identidad duplicada | La misma persona aparece repetida con el mismo caballo segundo | Sigue contando como una sola identidad | Deduplicar con la regla actual |
| Campaña antigua | Falta `points.exclusiveSecond` | El exclusivo segundo vale lo mismo que `points.second` | No alterar el total histórico |
| Valor cero | `exclusiveSecond` está configurado en 0 | Se conserva el cero y la categoría calculada | No reemplazar por el valor inicial |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/components/CampaignWizard.jsx` -- carga, presenta y guarda el nuevo puntaje y color.
- `mockup-prototipo/src/services/scoringConfig.js` -- define y normaliza la quinta categoría de color.
- `mockup-prototipo/src/engine/scoreEngine.js` -- calcula exclusividad por caballo y posición para totales y picks enriquecidos.
- `parser.js` -- replica la normalización y el cálculo autoritativo para jornadas cerradas.
- `mockup-prototipo/src/components/tables/PicksTable.jsx` -- reconoce `exclusiveSecond` y pinta su insignia.
- `mockup-prototipo/src/services/exportStyles.js` -- aplica el nuevo color en PNG.
- `mockup-prototipo/tests/pointsScoring.test.cjs` -- demuestra equivalencia entre capas y cubre regresiones.

## Tasks & Acceptance

**Execution:**
- [x] `mockup-prototipo/src/components/CampaignWizard.jsx` -- agregar estado, hidratación, campo numérico y selector de color para Exclusivo 2.º; guardar ceros sin fallback incorrecto.
- [x] `mockup-prototipo/src/services/scoringConfig.js` -- incorporar `exclusiveSecond` a los colores válidos con su valor inicial.
- [x] `mockup-prototipo/src/engine/scoreEngine.js` -- detectar exclusividad de segundo, incluidos empates y retiros, reutilizando el conteo de identidades.
- [x] `parser.js` -- mantener la misma regla y compatibilidad para datos procesados fuera del frontend.
- [x] `mockup-prototipo/src/components/tables/PicksTable.jsx` y `mockup-prototipo/src/services/exportStyles.js` -- reconocer la categoría y respetar su color en pantalla y PNG.
- [x] `mockup-prototipo/tests/pointsScoring.test.cjs` -- automatizar todos los escenarios de la matriz y confirmar que dividendos y exclusivo primero no cambian.

**Acceptance Criteria:**
- Dada una campaña por puntos, cuando se configura puntaje y color de Exclusivo 2.º y se vuelve a editar, entonces ambos valores se conservan exactamente.
- Dado un segundo exclusivo, cuando se calculan tabla, total y PNG, entonces todos usan `exclusiveSecond` con el mismo puntaje y color.
- Dada una campaña antigua sin el campo, cuando se recalcula, entonces el total coincide con el comportamiento anterior.
- Dado un segundo compartido, cuando se calcula la carrera, entonces ningún participante recibe el valor exclusivo.

## Spec Change Log

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs` -- expected: escenarios nuevos y regresiones pasan.
- `npm run build --prefix mockup-prototipo` -- expected: compilación sin errores.
- `git diff --check` -- expected: diff limpio.

**Manual checks (if no CLI):**
- Crear y editar una campaña por puntos; confirmar los cinco puntajes/colores y que tabla y PNG coinciden.

## Suggested Review Order

**Regla de puntuación**

- Centraliza el puntaje exclusivo segundo y su fallback compatible.
  [`scoreEngine.js:123`](../../mockup-prototipo/src/engine/scoreEngine.js#L123)

- Cuenta identidades por caballo y posición, reutilizando retiros efectivos.
  [`scoreEngine.js:352`](../../mockup-prototipo/src/engine/scoreEngine.js#L352)

- Replica la categoría y fallback en el parser de jornadas cerradas.
  [`parser.js:318`](../../parser.js#L318)

**Configuración y presentación**

- Expone puntaje y color independientes dentro del asistente de campaña.
  [`CampaignWizard.jsx:1653`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L1653)

- Define el quinto color válido y su valor inicial.
  [`scoringConfig.js:6`](../../mockup-prototipo/src/services/scoringConfig.js#L6)

- Conserva categorías válidas incluso cuando su puntaje configurado es cero.
  [`PicksTable.jsx:7`](../../mockup-prototipo/src/components/tables/PicksTable.jsx#L7)

**Cobertura**

- Demuestra exclusivo único/compartido, empates, retiros y compatibilidad histórica.
  [`pointsScoring.test.cjs:149`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L149)

- Verifica equivalencia de aliases, cero estable y los cinco colores del PNG.
  [`pointsScoring.test.cjs:447`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L447)
