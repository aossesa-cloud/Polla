---
title: 'Formato PNG tipo ranking para pronósticos por puntos'
type: 'feature'
created: '2026-08-28'
status: 'done'
baseline_commit: '0738222bcfb735ea14af213243e9934c17c33369'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La tabla por puntos solo se descarga en formato de dos filas por participante. Algunas campañas necesitan una imagen compacta tipo ranking, donde el caballo y el color de la posición acertada aparezcan juntos.

**Approach:** Agregar una opción por campaña entre el PNG actual y “Ranking con pronósticos”: una fila por participante, ordenada por total, con los cinco colores configurables aplicados directamente al caballo.

## Boundaries & Constraints

**Always:** El formato actual será el predeterminado para campañas nuevas y antiguas; la opción estará en “Pronósticos PNG”, con vista previa, solo para modo puntos; copiar y descargar usarán el mismo formato; el compacto mostrará STUD, TOTAL y carreras; cada caballo usará el color de su `scoreKind`, aunque esa posición valga cero puntos; los desaciertos usarán el fondo neutro; se utilizará el total ya calculado; el orden será total descendente y los empates conservarán su orden previo; los grupos o llaves se mantendrán separados y se ordenarán internamente.

**Ask First:** Mezclar grupos, alterar el cálculo o agregar un desempate requiere aprobación.

**Never:** Cambiar la tabla visible, los dividendos o el cálculo; fijar colores; recalcular dentro del PNG; migrar campañas automáticamente; eliminar el formato actual.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Campaña antigua | Sin opción guardada | PNG actual | Fallback `standard` |
| Ranking compacto | Puntos + `ranking-picks` | Una fila, total descendente y caballo coloreado | Dato ausente queda neutro |
| Empate | Igual total | Conserva el orden previo | No inventa desempate |
| Posición con 0 puntos | Acierto con `scoreKind` | Colorea la celda por posición | No depende de `score > 0` |
| Dividendos | Opción residual compacta | Formato estándar | Ignora la opción |
| Grupos o duelos | Existen secciones | Conserva y ordena cada sección | No mezcla participantes |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/services/campaignStyles.js` -- persistencia y fallback de `pngOptions.picksLayout`.
- `mockup-prototipo/src/components/campaigns/CampaignStyleStep.jsx` y `.module.css` -- selector y vistas previas.
- `mockup-prototipo/src/services/exportStyles.js` -- render estándar y `ranking-picks`.
- `mockup-prototipo/src/App.jsx` y `components/tables/PicksTableContainer.jsx` -- exportación principal.
- `mockup-prototipo/src/components/campaigns/CampaignDetailModal.jsx` -- exportación desde detalle.
- `mockup-prototipo/tests/pointsScoring.test.cjs` -- regresiones y casos nuevos.

## Tasks & Acceptance

**Execution:**
- [x] `campaignStyles.js` -- añadir valores permitidos, fallback y propagación.
- [x] `CampaignStyleStep.jsx` y `.module.css` -- añadir selector y vista previa solo en puntos.
- [x] `exportStyles.js` -- añadir una fila, orden estable y color sobre el caballo.
- [x] `App.jsx`, `PicksTableContainer.jsx` y `CampaignDetailModal.jsx` -- conectar ambas rutas de exportación.
- [x] `pointsScoring.test.cjs` -- cubrir la matriz y proteger el formato actual.

**Acceptance Criteria:**
- Given una campaña por puntos, when se elige “Ranking con pronósticos”, then guardar y editar conserva la elección.
- Given el compacto, when se copia o descarga, then ambas imágenes tienen una fila, total descendente y colores dentro de los pronósticos.
- Given una campaña antigua o en dividendos, when se exporta, then conserva el formato actual.
- Given cualquiera de las cinco categorías, when el caballo acierta, then usa su color independiente.

## Spec Change Log

## Design Notes

El selector tendrá “Formato actual” y “Ranking con pronósticos”. El compacto reproduce la estructura de la referencia, respeta el tema PNG para fondos, bordes y textos, y toma los aciertos de los colores de puntos de la campaña.

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs` -- pruebas y regresiones pasan.
- `npm run build --prefix mockup-prototipo` -- compilación sin errores.

**Manual checks (if no CLI):**
- Crear/editar una campaña, alternar formatos y comparar vista previa, copiar y descargar.

## Suggested Review Order

**Render y reglas del formato**

- Activa el compacto solo cuando todas las filas usan puntos.
  [`exportStyles.js:359`](../../mockup-prototipo/src/services/exportStyles.js#L359)

- Renderiza caballo y color juntos, incluso cuando la categoría vale cero.
  [`exportStyles.js:431`](../../mockup-prototipo/src/services/exportStyles.js#L431)

- Recupera totales antiguos vacíos sin reemplazar un cero válido.
  [`exportStyles.js:294`](../../mockup-prototipo/src/services/exportStyles.js#L294)

- Conserva secciones y el orden estable previo dentro de cada grupo.
  [`exportStyles.js:493`](../../mockup-prototipo/src/services/exportStyles.js#L493)

**Configuración de campaña**

- Define valores permitidos y fallback seguro para campañas antiguas.
  [`campaignStyles.js:251`](../../mockup-prototipo/src/services/campaignStyles.js#L251)

- Normaliza la elección entre formulario, persistencia y consumidores.
  [`campaignStyles.js:280`](../../mockup-prototipo/src/services/campaignStyles.js#L280)

**Selector y vista previa**

- Ofrece ambos formatos únicamente en campañas por puntos.
  [`CampaignStyleStep.jsx:305`](../../mockup-prototipo/src/components/campaigns/CampaignStyleStep.jsx#L305)

- Previsualiza una fila usando los cinco colores configurables.
  [`CampaignStyleStep.jsx:509`](../../mockup-prototipo/src/components/campaigns/CampaignStyleStep.jsx#L509)

- Mantiene el selector accesible mediante teclado.
  [`CampaignStyleStep.module.css:484`](../../mockup-prototipo/src/components/campaigns/CampaignStyleStep.module.css#L484)

**Rutas de exportación**

- Usa el formato estándar al combinar varias campañas.
  [`App.jsx:346`](../../mockup-prototipo/src/App.jsx#L346)

- Propaga la opción a copiar y descargar desde la tabla.
  [`PicksTableContainer.jsx:263`](../../mockup-prototipo/src/components/tables/PicksTableContainer.jsx#L263)

- Conserva scoring y formato al exportar desde el detalle.
  [`CampaignDetailModal.jsx:1290`](../../mockup-prototipo/src/components/campaigns/CampaignDetailModal.jsx#L1290)

**Cobertura**

- Verifica persistencia, colores, cero puntos y orden estable.
  [`pointsScoring.test.cjs:782`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L782)

- Protege grupos, totales antiguos, dividendos y ambas rutas.
  [`pointsScoring.test.cjs:864`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L864)
