---
title: 'Sincronizar puntos entre la tabla de pronósticos y la imagen'
type: 'bugfix'
created: '2026-08-18'
status: 'done'
baseline_commit: '375a62a26dd2866eb1579fe98349bfe8046798e4'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En una campaña configurada por puntos, el total de cada participante y la imagen descargada usan puntos, pero las casillas de la tabla visible recalculan dividendos y los muestran con `$`. Esto hace que una misma jornada presente dos valores distintos para la misma selección.

**Approach:** Hacer que la tabla visible consuma el mismo resultado por carrera que ya produce el motor común para la exportación. En modo puntos mostrará el puntaje configurado sin `$`; en modo dividendos conservará el comportamiento visual actual.

## Boundaries & Constraints

**Always:** Usar la configuración de la campaña seleccionada; calcular la puntuación de todas las filas en conjunto para preservar la exclusividad; mantener iguales en pantalla y exportación los criterios de primero, segundo, tercero, exclusivo, empates, retiros que defienden al favorito y última carrera doble; conservar totales, orden, números elegidos y etiquetas de acierto/favorito/retiro.

**Ask First:** Cualquier cambio a los valores configurados, a la definición de exclusivo, a las reglas de empate o retiro, al diseño de la imagen exportada o a la visualización de campañas por dividendos.

**Never:** Modificar datos de campañas o jornadas; duplicar dentro de la interfaz las reglas del motor de puntuación; alterar rankings o totales; ampliar el arreglo a otros modos o pantallas no relacionadas.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Campaña por puntos | Acierto de primero, segundo, tercero o exclusivo | La casilla muestra el valor configurado, por ejemplo `10`, `5`, `1` o `20`, sin `$` | Si no hay puntuación, no muestra insignia |
| Campaña por dividendos | Acierto con dividendos disponibles | Conserva la insignia actual con `$` y el valor calculado | Si no hay dividendo, no muestra insignia |
| Retiro defendido | El elegido fue retirado y el favorito efectivo acierta | Pantalla e imagen muestran la misma puntuación | Conserva las etiquetas `Ret→Fav` y `Fav` |
| Empate | Hay empate en primero o segundo | La casilla usa exactamente el puntaje producido por el motor común | No recalcula reglas localmente |
| Exclusivo | Una sola persona tiene el ganador efectivo | Sólo esa selección muestra los puntos exclusivos configurados | La frecuencia se evalúa sobre todas las filas visibles de la jornada |
| Cambio de campaña | Se alterna entre una campaña por puntos y otra por dividendos | Las casillas se actualizan al modo seleccionado sin arrastrar el formato anterior | La configuración de cada fila prevalece cuando corresponda |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/components/tables/PicksTable.jsx` -- renderiza las casillas visibles y actualmente calcula dividendos de forma local.
- `mockup-prototipo/src/components/tables/PicksTableContainer.jsx` -- resuelve la campaña, la configuración y prepara los datos usados por la tabla y la exportación.
- `mockup-prototipo/src/engine/scoreEngine.js` -- fuente común que enriquece cada selección con su puntuación correcta.
- `mockup-prototipo/tests/pointsScoring.test.cjs` -- cobertura existente de puntos, exclusivos, empates, retiros y herencia de configuración.

## Tasks & Acceptance

**Execution:**
- [x] `mockup-prototipo/src/components/tables/PicksTable.jsx` -- reemplazar el cálculo local de dividendos por la puntuación enriquecida del motor y formatearla según el modo -- eliminar la divergencia entre pantalla e imagen.
- [x] `mockup-prototipo/src/components/tables/PicksTableContainer.jsx` -- preparar o reutilizar una sola colección enriquecida para la tabla visible y su captura -- asegurar que exclusivo, empates y retiros compartan la misma fuente de verdad.
- [x] `mockup-prototipo/tests/pointsScoring.test.cjs` -- cubrir la integración de la tabla con el puntaje enriquecido y el formato por modo -- prevenir la regresión observada.

**Acceptance Criteria:**
- Dada la campaña diaria del 21-05-2026 configurada con `10/5/1/20`, cuando se abre la tabla, entonces MANZANA muestra `5` en la carrera 1 y `10` en la carrera 3, sin `$`, igual que la imagen descargada.
- Dada cualquier campaña por puntos, cuando se compara cada casilla visible con la imagen exportada, entonces ambas muestran el mismo puntaje por carrera.
- Dada una campaña por dividendos, cuando se abre la tabla, entonces sus insignias continúan mostrando `$` y sus valores anteriores.
- Dada una selección sin acierto, cuando se renderiza su casilla, entonces no aparece una insignia de puntuación.

## Spec Change Log

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs` -- expected: todas las pruebas de puntos e integración de tabla pasan.
- `npm run build --prefix mockup-prototipo` -- expected: la aplicación compila sin errores.
- `npm test` -- expected: la validación general del proyecto pasa sin modificar los datos operativos.

## Suggested Review Order

**Fuente única de puntuación**

- Enriquece toda la jornada antes de separar grupos o generar la imagen.
  [`PicksTableContainer.jsx:181`](../../mockup-prototipo/src/components/tables/PicksTableContainer.jsx#L181)

- La exportación reutiliza exactamente la misma colección ya puntuada.
  [`PicksTableContainer.jsx:247`](../../mockup-prototipo/src/components/tables/PicksTableContainer.jsx#L247)

**Presentación y compatibilidad**

- Conserva insignias cuando otro consumidor entrega pronósticos todavía crudos.
  [`PicksTable.jsx:15`](../../mockup-prototipo/src/components/tables/PicksTable.jsx#L15)

- Formatea puntos sin dólar y dividendos con su prefijo habitual.
  [`PicksTable.jsx:138`](../../mockup-prototipo/src/components/tables/PicksTable.jsx#L138)

**Cobertura**

- Reproduce el caso MANZANA y valida los valores visibles esperados.
  [`pointsScoring.test.cjs:164`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L164)

- Protege consumidores con picks crudos y la colección compartida.
  [`pointsScoring.test.cjs:190`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L190)
