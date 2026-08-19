---
title: 'Corregir puntuación por puntos y ganador exclusivo'
type: 'bugfix'
created: '2026-08-18T00:00:00-04:00'
status: 'done'
baseline_commit: '2216df167b8cb43c597d8b8f02283e89f2b116e7'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Las campañas configuradas “por puntos” no respetan de forma consistente los valores de primer, segundo, tercer lugar y exclusivo. El evento operativo puede perder la configuración de su campaña y el motor frontend considera exclusivo a cualquier ganador sin empate, aunque varias personas hayan elegido el mismo número.

**Approach:** Mantener la configuración de puntos vinculada a cada evento y calcular la exclusividad a partir de todos los pronósticos efectivos de la carrera. Un ganador será exclusivo solamente cuando ese caballo o número ganador haya sido elegido por una única persona.

## Boundaries & Constraints

**Always:** Preservar campañas y datos existentes; aplicar los valores configurados por campaña, incluidos ceros; usar la misma regla de exclusividad en total, detalle por carrera, ranking y exportación; considerar como pronóstico efectivo al favorito cuando el elegido fue retirado; mantener soporte para empates en 1.º, 2.º y 3.º.

**Ask First:** Cualquier cambio a la definición de exclusivo distinta de “un ganador elegido por una única persona”, o cualquier migración/modificación de datos persistidos en `data/overrides.json`.

**Never:** Cambiar el cálculo por dividendos, la regla de última carrera x2, los modos de competencia, premios o relaciones; editar datos operativos existentes; otorgar exclusivo basándose solamente en que no hubo empate en el resultado.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ganador compartido | Dos o más personas eligen el mismo ganador | Cada una recibe `points.first` | N/A |
| Ganador exclusivo | Una sola persona elige ese número ganador | Esa persona recibe `points.exclusiveFirst` | N/A |
| Posiciones | Picks aciertan 2.º o 3.º | Reciben exactamente `points.second` o `points.third` | N/A |
| Empate en 1.º | Hay dos caballos ganadores | La exclusividad se evalúa por cada caballo ganador y por personas que lo eligieron | N/A |
| Retiro defendido | El pick retirado se reemplaza por favorito ganador | Cuenta como selección efectiva del favorito para puntos y exclusividad | N/A |
| Valor cero | Una posición está configurada en `0` | Se guarda, reabre y calcula como cero, sin reemplazarlo por el valor predeterminado | N/A |
| Evento fechado | El ID del evento agrega fecha al ID de campaña | Hereda el modo y valores de puntos de la campaña vinculada | Si falta vínculo explícito, usar coincidencia segura con ID; si no existe campaña, conservar configuración propia/default |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/engine/scoreEngine.js` -- fuente del recálculo frontend usado por tablas, ranking, detalle y exportación.
- `parser.js` -- normaliza eventos y calcula puntajes backend; actualmente puede perder el vínculo de una campaña diaria fechada.
- `mockup-prototipo/src/components/CampaignWizard.jsx` -- carga y guarda los cuatro valores configurables; actualmente reemplaza ceros por defaults.
- `mockup-prototipo/tests/pointsScoring.test.cjs` -- pruebas de regresión del motor y del vínculo campaña-evento.

## Tasks & Acceptance

**Execution:**
- [x] `mockup-prototipo/src/engine/scoreEngine.js` -- contar por carrera y caballo ganador las personas con ese pick efectivo, y usar el conteo para decidir `exclusiveFirst` tanto en totales como en picks enriquecidos.
- [x] `parser.js` -- resolver la campaña de cada evento mediante `meta.campaignId` y fallbacks seguros de ID, conservar su `scoring`, y alinear el cálculo backend de exclusividad con el frontend.
- [x] `mockup-prototipo/src/components/CampaignWizard.jsx` -- preservar valores numéricos válidos, incluido `0`, al editar y guardar.
- [x] `mockup-prototipo/tests/pointsScoring.test.cjs` -- cubrir la matriz, además de asegurar que dividendos y última carrera x2 no cambien.

**Acceptance Criteria:**
- Given una campaña con valores personalizados, when se calculan resultados en cualquiera de sus jornadas, then ranking, tabla y exportación usan esos mismos valores.
- Given el caso real donde tres participantes eligen al ganador, when se recalcula la carrera, then los tres reciben puntos de primer lugar y ninguno recibe exclusivo.
- Given una configuración por dividendos, when se ejecuta la misma batería de regresión, then su cálculo y la opción de última carrera x2 conservan el comportamiento previo.
- Given el proyecto con cambios locales previos, when termina la implementación, then solamente se modifican los archivos de esta corrección y no los datos del usuario.

## Spec Change Log

## Design Notes

La exclusividad es una propiedad colectiva de la carrera, no del resultado aislado de un participante. Debe determinarse antes de puntuar cada fila, contando identidades de participantes por pick efectivo ganador. En un empate de primer lugar, cada caballo ganador se evalúa por separado.

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs` -- expected: todos los escenarios y regresiones pasan.
- `npm run build` desde `mockup-prototipo` -- expected: build Vite sin errores.
- `npm test` desde la raíz -- expected: parser carga datos sin errores.

## Suggested Review Order

**Exclusividad y puntaje efectivo**

- El conteo colectivo por carrera y caballo define el exclusivo antes de puntuar.
  [`scoreEngine.js:307`](../../mockup-prototipo/src/engine/scoreEngine.js#L307)

- Los totales diarios consumen la misma exclusividad y configuración por entrada.
  [`scoreEngine.js:19`](../../mockup-prototipo/src/engine/scoreEngine.js#L19)

- El detalle enriquecido reutiliza exactamente la regla de los totales.
  [`scoreEngine.js:374`](../../mockup-prototipo/src/engine/scoreEngine.js#L374)

- Backend deduplica personas y cuenta retiros defendidos por cada ganador.
  [`parser.js:287`](../../parser.js#L287)

**Vínculo campaña-evento**

- El resolver prioriza vínculo explícito, coincidencias exactas y prefijos seguros.
  [`parser.js:564`](../../parser.js#L564)

- El mapa conserva scoring de campaña en jornadas fechadas sin revivir deshabilitadas.
  [`parser.js:680`](../../parser.js#L680)

**Configuración y regresiones**

- La normalización del wizard conserva cero y descarta valores inválidos.
  [`CampaignWizard.jsx:168`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L168)

- La edición reabre los cuatro puntajes personalizados sin sustituir cero.
  [`CampaignWizard.jsx:537`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L537)

- Las pruebas validan exclusividad, empates, retiros, ceros y dividendos.
  [`pointsScoring.test.cjs:34`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L34)

- Los casos límite cubren IDs solapados, deshabilitados y scoring propio.
  [`pointsScoring.test.cjs:310`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L310)
