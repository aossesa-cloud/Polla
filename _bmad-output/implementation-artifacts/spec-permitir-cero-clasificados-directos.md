---
title: 'Permitir cero clasificados directos en clasificación con repechaje'
type: 'feature'
created: '2026-08-25'
status: 'done'
baseline_commit: '9f17c6a'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En el formato semanal `Clasificación + duelos + final`, el campo de clasificados directos exige al menos uno y varias normalizaciones convierten un cero explícito nuevamente en el valor predeterminado 2. Esto impide organizar campañas donde solo se eliminan los últimos y todos los demás disputan el repechaje.

**Approach:** Permitir y conservar `0` como cantidad válida de clasificados directos exclusivamente en el formato `playoff-final`, desde la configuración y edición de la campaña hasta el cálculo de clasificados. Mantener el valor predeterminado 2 cuando el campo no existe o es inválido, y dejar sin cambios los demás formatos.

## Boundaries & Constraints

**Always:** El cero explícito debe sobrevivir la carga, edición, guardado y cálculo de la campaña. La cantidad configurada de eliminados se toma desde el final de la tabla ordenada y el resto completo pasa al repechaje. El orden, los desempates, los cruces y los pases libres existentes se conservan. Una campaña nueva sigue comenzando con 2 clasificados directos. Los textos del formulario y de la tarjeta del modo no deben prometer un “Top 2” fijo.

**Ask First:** Cambiar el valor predeterminado de 2; permitir cero directos por grupo en `group-playoff-final`; cambiar la cantidad automática de eliminados; alterar el orden de cruces, las reglas de desempate o el tratamiento del participante libre.

**Never:** Modificar `final-qualification`, `group-playoff-final` u otros formatos; interpretar cero como dato ausente; cambiar puntuación, dividendos, resultados, retiros o empates; eliminar participantes adicionales para obtener una cantidad par de cruces.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Campaña solicitada | 35 participantes, 0 directos, 2 eliminados | 0 directos, 33 al repechaje, 2 eliminados; 16 duelos y 1 participante libre | N/A |
| Sin eliminados | 35 participantes, 0 directos, 0 eliminados | Los 35 pasan al repechaje | N/A |
| Compatibilidad | Campo directo ausente en campaña antigua | Se aplica el valor predeterminado 2 | N/A |
| Valor inválido | Directos vacío, negativo o no numérico | El formulario no permite finalizar | No guardar ni convertir silenciosamente el valor ingresado |
| Formato agrupado | `group-playoff-final` con cero directos | Conserva su restricción actual de al menos 1 por grupo | Impedir finalizar la configuración |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/components/CampaignWizard.jsx` -- presenta, valida, hidrata y serializa la cantidad de clasificados directos.
- `mockup-prototipo/src/services/campaignModeConfig.js` -- normaliza y replica la configuración semanal entre la raíz de campaña y `modeConfig`.
- `mockup-prototipo/src/services/playoffFinalMode.js` -- normaliza la configuración usada por el reparto entre directos, repechaje y eliminados.
- `mockup-prototipo/src/engine/modeEngine.js` -- contiene la descripción visible de la tarjeta del formato.
- `mockup-prototipo/tests/playoffFinalMode.test.cjs` -- cubrirá persistencia, reparto y compatibilidad del valor cero.

## Tasks & Acceptance

**Execution:**
- [x] `mockup-prototipo/src/components/CampaignWizard.jsx` -- aceptar mínimo cero solo en `playoff-final`, conservar valores cero al crear/editar/cambiar modo, guardar como entero no negativo y mostrar una explicación coherente cuando nadie va directo.
- [x] `mockup-prototipo/src/services/campaignModeConfig.js` -- normalizar `directQualifiersCount` como no negativo solo para `playoff-final`, manteniendo la normalización positiva de los demás formatos.
- [x] `mockup-prototipo/src/services/playoffFinalMode.js` -- preservar cero al consumir el formato simple y mantener la restricción del formato agrupado.
- [x] `mockup-prototipo/src/engine/modeEngine.js` -- reemplazar “Top 2” por una descripción que comunique que los cupos directos y eliminados son configurables.
- [x] `mockup-prototipo/tests/playoffFinalMode.test.cjs` -- probar todos los escenarios de la matriz y la formación de cruces con cantidad impar.

**Acceptance Criteria:**
- Dada una campaña semanal `playoff-final`, cuando el administrador configura 0 directos y guarda, entonces al volver a editar se muestra 0 y no 2.
- Dada una clasificación de 35 participantes con 0 directos y 2 eliminados, cuando termina la clasificación, entonces solo los últimos 2 quedan eliminados y los otros 33 figuran en repechaje.
- Dada una campaña antigua sin el campo, cuando se normaliza, entonces conserva el comportamiento predeterminado de 2 directos.
- Dado el formato agrupado, cuando se intenta configurar 0 directos por grupo, entonces el formulario continúa rechazándolo.

## Spec Change Log

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/playoffFinalMode.test.cjs` -- expected: todos los escenarios dirigidos pasan.
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs` -- expected: no hay regresiones en puntuación ni presentación de resultados.
- `npm run build --prefix mockup-prototipo` -- expected: la aplicación compila sin errores.

**Manual checks (if no CLI):**
- Crear y volver a editar una campaña `Clasificación + duelos + final` con 0 directos; confirmar que el resumen dice que nadie pasa directo y conserva el cero.

## Suggested Review Order

**Configuración y experiencia**

- Valida cero solo en el formato simple y rechaza entradas vacías o inseguras.
  [`CampaignWizard.jsx:204`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L204)

- Conserva el cero al editar, guarda el valor correcto y explica que nadie pasa directo.
  [`CampaignWizard.jsx:679`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L679)

- Comunica desde la tarjeta que ambos cupos son configurables.
  [`modeEngine.js:46`](../../mockup-prototipo/src/engine/modeEngine.js#L46)

**Persistencia y cálculo**

- Preserva cero en la configuración semanal sin cambiar el formato agrupado.
  [`campaignModeConfig.js:78`](../../mockup-prototipo/src/services/campaignModeConfig.js#L78)

- Resuelve el formato coherentemente y entrega cero al reparto existente.
  [`playoffFinalMode.js:21`](../../mockup-prototipo/src/services/playoffFinalMode.js#L21)

- Mantiene el reparto ordenado entre directos, repechaje y eliminados.
  [`playoffFinalMode.js:62`](../../mockup-prototipo/src/services/playoffFinalMode.js#L62)

**Cobertura**

- Verifica 35 participantes, ceros configurables, compatibilidad y formatos excluidos.
  [`playoffFinalMode.test.cjs:67`](../../mockup-prototipo/tests/playoffFinalMode.test.cjs#L67)
