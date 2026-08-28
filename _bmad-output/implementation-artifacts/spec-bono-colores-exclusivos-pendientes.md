---
title: 'Bono por dividendo y marcas visuales de exclusivos pendientes'
type: 'feature'
created: '2026-08-28'
status: 'done'
baseline_commit: 'dc2126a'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** El modo por puntos debe premiar también un dividendo ganador exactamente igual a 10 y permitir identificar visualmente tanto los bonos como los pronósticos exclusivos de carreras todavía no corridas.

**Approach:** Cambiar el umbral del bono a `>= 10`. Mantener separados los colores de primero +3 y exclusivo primero +3, y agregar un color configurable para un pick único por carrera pendiente. Mostrar una leyenda en la tabla y en su PNG.

## Boundaries & Constraints

**Always:** El bono sigue siendo exactamente 3 puntos y aplica solo a primero normal o exclusivo primero en modo `points`; 10 exactos sí activa el bono; segundos, terceros y modo dividendos no cambian. Los colores de primero +3, exclusivo primero +3 y exclusivo pendiente se guardan dentro de la configuración de la campaña, tienen valores predeterminados y contraste legible. Un exclusivo pendiente significa que solo un participante eligió ese ejemplar para esa carrera, sin importar si la carrera tiene resultado; se marca solo visualmente y nunca suma puntos. La leyenda explica todos los colores de puntos, bonos y exclusivos pendientes. La vista visible, el copiar PNG y descargar PNG deben coincidir. La exclusividad se calcula sobre todos los participantes de la campaña, también cuando la tabla está agrupada.

**Ask First:** Cambiar el valor 3, el umbral 10, convertir el marcador pendiente en puntos o modificar el formato de ranking requiere aprobación.

**Never:** Alterar el modo por dividendos, cambiar los puntajes base, marcar como pendiente un pick repetido, ocultar los exclusivos de carreras futuras, aplicar el bono más de una vez por carrera o alterar el orden de participantes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Primero normal | Dividendo 10 | Puntaje configurado + 3 y color primero +3 | N/A |
| Exclusivo primero | Dividendo 10 o mayor | Puntaje exclusivo configurado + 3 y color exclusivo +3 | N/A |
| Dividendo menor | Dividendo 9,99 | Puntaje configurado sin bono | N/A |
| Segundo o tercero | Dividendo ganador alto | Puntaje normal de la posición y color original | No hereda el bono |
| Carrera pendiente | Un solo pick para un ejemplar | Color exclusivo pendiente, sin score ni total | Pick vacío queda neutro |
| Carrera pendiente repetida | Dos o más picks iguales | Sin color de exclusivo pendiente | No marcar repetidos |
| Empate o retiro | Resultado efectivo ya resuelto | Conserva bono y colores actuales por posición | Usa favorito efectivo |
| Grupos | Tabla separada por grupo | Marca exclusividad usando toda la campaña | No recalcular por grupo |
| Leyenda | Modo puntos | Explica colores de posición, bonos y pendiente | No aparece como regla de dividendos |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/engine/scoreEngine.js` -- umbral del bono y cálculo de picks únicos por carrera.
- `parser.js` -- paridad del umbral para datos importados.
- `mockup-prototipo/src/services/scoringConfig.js` -- defaults, normalización y contraste de colores.
- `mockup-prototipo/src/components/CampaignWizard.jsx` -- configuración de los tres colores adicionales.
- `mockup-prototipo/src/components/tables/PicksTableContainer.jsx` -- exclusividad pendiente global y propagación a grupos/exportación.
- `mockup-prototipo/src/components/tables/PicksTable.jsx` -- colores, leyenda y marca visual en tabla.
- `mockup-prototipo/src/services/exportStyles.js` -- leyenda y colores en PNG.
- `mockup-prototipo/src/services/raceStatus.js` -- define cuándo una carrera tiene resultado real.
- `mockup-prototipo/src/components/campaigns/CampaignDetailModal.jsx` -- comparte exclusividad global con tablas agrupadas.
- `mockup-prototipo/tests/pointsScoring.test.cjs` -- umbral inclusivo, colores, leyenda, pendientes y regresiones.

## Tasks & Acceptance

**Execution:**
- [x] Cambiar el umbral frontend/backend a `>= 10` y mantener paridad.
- [x] Agregar colores configurables para primero +3, exclusivo primero +3 y exclusivo pendiente.
- [x] Calcular y mostrar exclusivos pendientes sin alterar puntajes, incluyendo tablas agrupadas.
- [x] Agregar leyenda visible y exportada.
- [x] Cubrir pruebas y regresiones.

**Acceptance Criteria:**
- Given modo puntos y ganador con dividendo 10, when se calcula, then primero normal y exclusivo reciben +3.
- Given una campaña configurada, when se cambian los tres colores, then tabla, leyenda y PNG usan esos colores.
- Given una carrera sin resultado y un ejemplar elegido por un solo participante, when se muestra la tabla, then se marca con el color de exclusivo pendiente y el total no cambia.
- Given una carrera sin resultado y un ejemplar repetido, when se muestra la tabla, then no se marca como exclusivo pendiente.
- Given resultados parciales, when se muestra la tabla, then las carreras futuras continúan mostrando sus exclusivos pendientes.
- Given grupos, when se muestra o exporta, then la unicidad se calcula contra todos los participantes.

## Spec Change Log

## Design Notes

Los bonos se diferencian de los colores de posición mediante claves visuales propias, sin cambiar `scoreKind`. El marcador pendiente es una propiedad visual separada y no participa en el motor de puntaje.

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs`
- `npm run build --prefix mockup-prototipo`

**Manual checks (if no CLI):**
- Configurar colores, abrir una campaña sin resultados y verificar únicos por carrera; cargar resultados parciales y confirmar que las carreras siguientes siguen marcando únicos.

## Suggested Review Order

**Regla y configuración**

- Confirma el umbral inclusivo y las nuevas claves de color reutilizables.
  [`scoreEngine.js:140`](../../mockup-prototipo/src/engine/scoreEngine.js#L140)
- Revisa defaults, validación y selección de color para bonos y exclusivos futuros.
  [`scoringConfig.js:1`](../../mockup-prototipo/src/services/scoringConfig.js#L1)
  [`CampaignWizard.jsx:1663`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L1663)

**Exclusivos futuros**

- Verifica que solo picks únicos se marquen y nunca alteren el puntaje.
  [`scoreEngine.js:405`](../../mockup-prototipo/src/engine/scoreEngine.js#L405)
- Comprueba que el mapa global llegue a tablas agrupadas y no excluya eliminados.
  [`PicksTableContainer.jsx:196`](../../mockup-prototipo/src/components/tables/PicksTableContainer.jsx#L196)
  [`CampaignDetailModal.jsx:311`](../../mockup-prototipo/src/components/campaigns/CampaignDetailModal.jsx#L311)
- Comprueba que un resultado incompleto siga siendo carrera futura.
  [`raceStatus.js:70`](../../mockup-prototipo/src/services/raceStatus.js#L70)

**Presentación y cobertura**

- Revisa leyenda, colores de bonos y marcador pendiente en la tabla visible.
  [`PicksTable.jsx:86`](../../mockup-prototipo/src/components/tables/PicksTable.jsx#L86)
- Revisa la misma leyenda y colores en el PNG exportado.
  [`exportStyles.js:561`](../../mockup-prototipo/src/services/exportStyles.js#L561)
- Valida umbral, colores, carreras futuras, resultados parciales y regresiones.
  [`pointsScoring.test.cjs:76`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L76)
