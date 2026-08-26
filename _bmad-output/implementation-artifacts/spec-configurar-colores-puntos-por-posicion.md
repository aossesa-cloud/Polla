---
title: 'Configurar colores de puntos por posición'
type: 'feature'
created: '2026-08-18'
status: 'done'
baseline_commit: 'dda1170692e7825ae61cb3747213912842434013'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Las insignias de puntuación usan un solo color, por lo que no permiten distinguir visualmente si los puntos corresponden a primero, segundo, tercero o ganador exclusivo. Además, la tabla visible y la imagen exportada deben conservar la misma identificación visual.

**Approach:** Añadir a cada campaña por puntos cuatro colores configurables y transportar desde el motor una categoría explícita del acierto. Esa categoría determinará el color de fondo de la insignia en pantalla y de la celda de puntos en el PNG, con texto blanco o negro calculado automáticamente para mantener legibilidad.

## Boundaries & Constraints

**Always:** Configurar los colores por campaña y únicamente cuando el modo sea `points`; ofrecer selectores para primero, segundo, tercero y exclusivo junto a sus valores numéricos; aplicar los mismos colores en la tabla visible, el detalle de campaña y la imagen descargada; identificar la posición mediante una categoría calculada por el motor, nunca comparando cantidades de puntos; conservar empates, retiros que defienden favorito y exclusividad; validar colores como hexadecimal `#RRGGBB`; mantener compatibilidad con campañas existentes mediante valores predeterminados: primero `#10B981`, segundo `#3B82F6`, tercero `#F59E0B` y exclusivo `#8B5CF6`.

**Ask First:** Cambiar los cuatro colores predeterminados; colorear también el número del caballo, la etiqueta `✓1°/✓2°/✓3°`, el total acumulado o el ranking; agregar transparencia, degradados o controles de color distintos al selector hexadecimal estándar.

**Never:** Cambiar cuántos puntos entrega cada posición; inferir la posición comparando el puntaje obtenido con los valores configurados; aplicar estos colores a campañas por dividendos; modificar datos operativos existentes o exigir una migración manual; permitir valores de color sin sanitizar dentro del HTML exportado.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Configuración nueva | Campaña por puntos con cuatro colores seleccionados | Guarda `scoring.pointColors` y reutiliza los colores al editar | Color ausente o inválido usa su predeterminado |
| Primero compartido | Dos o más personas aciertan el ganador | Cada badge usa color de primero | El valor numérico sigue siendo `points.first` |
| Primero exclusivo | Una sola persona tiene ese caballo ganador efectivo | El badge usa color exclusivo | No depende de que `first` y `exclusiveFirst` tengan valores diferentes |
| Segundo o tercero empatado | Pick coincide con cualquiera de los caballos empatados | Usa color de segundo o tercero respectivamente | Mantiene el puntaje de la posición existente |
| Retiro defendido | El caballo retirado pasa al favorito y acierta | Usa el color de la posición lograda por el favorito efectivo | Conserva la etiqueta `Ret→Fav` |
| Puntajes iguales | Dos posiciones están configuradas con la misma cantidad | Cada una conserva su propio color por categoría | Nunca infiere categoría desde el número |
| Puntaje cero | La posición entrega `0` | Conserva categoría internamente, pero no muestra insignia | Mantiene el comportamiento actual |
| Campaña por dividendos | Existen colores de puntos guardados | Pantalla y PNG conservan sus colores de dividendos actuales | Ignora `pointColors` |
| Campaña antigua | No tiene `pointColors` | Resuelve automáticamente los cuatro predeterminados | No modifica la campaña hasta que el usuario la guarde |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/components/CampaignWizard.jsx` -- carga, edita y guarda valores y colores de puntuación para los tres tipos de campaña.
- `mockup-prototipo/src/components/CampaignWizard.module.css` -- organiza cada valor de puntos con su selector de color.
- `mockup-prototipo/src/services/scoringConfig.js` -- define colores predeterminados, valida valores y fusiona configuraciones parciales.
- `parser.js` -- normaliza y hereda `pointColors` hacia las jornadas sin perder compatibilidad histórica.
- `mockup-prototipo/src/engine/scoreEngine.js` -- determina y adjunta `scoreKind` a cada pick enriquecido.
- `mockup-prototipo/src/components/tables/PicksTable.jsx` -- aplica el color configurado a la insignia visible.
- `mockup-prototipo/src/services/exportStyles.js` -- aplica el mismo color y contraste a la celda del PNG.
- `mockup-prototipo/tests/pointsScoring.test.cjs` -- cubre categorías, configuración, compatibilidad y render/exportación.

## Tasks & Acceptance

**Execution:**
- [x] `mockup-prototipo/src/services/scoringConfig.js` y `parser.js` -- incorporar defaults, validación y fusión profunda de `pointColors` -- garantizar persistencia e herencia seguras.
- [x] `mockup-prototipo/src/components/CampaignWizard.jsx` y `CampaignWizard.module.css` -- agregar cuatro selectores, hidratar edición y guardar el esquema común -- permitir configuración por campaña diaria, semanal o mensual.
- [x] `mockup-prototipo/src/engine/scoreEngine.js` -- producir `scoreKind` desde la misma clasificación usada para calcular puntos -- evitar inferencias ambiguas y conservar empates/retiros/exclusividad.
- [x] `mockup-prototipo/src/components/tables/PicksTable.jsx` y `mockup-prototipo/src/services/exportStyles.js` -- resolver color y contraste desde `scoreKind` sólo en modo puntos -- mantener pantalla y PNG consistentes.
- [x] `mockup-prototipo/tests/pointsScoring.test.cjs` -- automatizar la matriz de casos y la compatibilidad con dividendos/campañas antiguas -- prevenir regresiones.

**Acceptance Criteria:**
- Dada una campaña por puntos con cuatro colores distintos, cuando se muestran aciertos de las cuatro categorías, entonces cada insignia visible y su celda exportada usan el color configurado correspondiente.
- Dados valores numéricos iguales para dos posiciones, cuando ambas aciertan, entonces los colores siguen siendo distintos según su categoría.
- Dado un empate o un retiro defendido, cuando el pick recibe puntos, entonces su color corresponde a la posición efectiva y coincide entre pantalla y PNG.
- Dada una campaña existente sin colores, cuando se abre o calcula, entonces funciona con los predeterminados sin cambiar sus puntos ni exigir edición.
- Dada una campaña por dividendos, cuando se visualiza o exporta, entonces conserva exactamente su formato de color anterior.

## Spec Change Log

## Design Notes

El dato persistido será independiente del valor numérico:

```text
scoring.pointColors.first
scoring.pointColors.second
scoring.pointColors.third
scoring.pointColors.exclusiveFirst
pick.scoreKind = first | second | third | exclusiveFirst | null
```

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs` -- expected: pasan categorías, colores, empates, retiros, exclusivo y dividendos.
- `npm run build --prefix mockup-prototipo` -- expected: la aplicación compila sin errores.
- `npm test` -- expected: la validación general pasa sin modificar `data/overrides.json`.

## Suggested Review Order

**Configuración por campaña**

- Los cuatro selectores viven junto a sus valores de puntuación.
  [`CampaignWizard.jsx:1605`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L1605)

- La campaña guarda la paleta validada dentro de su puntuación.
  [`CampaignWizard.jsx:714`](../../mockup-prototipo/src/components/CampaignWizard.jsx#L714)

- Defaults, fusión parcial y contraste legible se resuelven centralmente.
  [`scoringConfig.js:1`](../../mockup-prototipo/src/services/scoringConfig.js#L1)

**Clasificación y presentación**

- El motor clasifica la posición sin inferirla desde el valor numérico.
  [`scoreEngine.js:118`](../../mockup-prototipo/src/engine/scoreEngine.js#L118)

- La tabla aplica el color configurado sólo a badges por puntos.
  [`PicksTable.jsx:161`](../../mockup-prototipo/src/components/tables/PicksTable.jsx#L161)

- El PNG reutiliza categoría, color y contraste de la misma campaña.
  [`exportStyles.js:297`](../../mockup-prototipo/src/services/exportStyles.js#L297)

**Compatibilidad y cobertura**

- El parser sanitiza colores y completa campañas históricas con defaults.
  [`parser.js:76`](../../parser.js#L76)

- Las pruebas cubren categorías iguales, paletas parciales, PNG y dividendos.
  [`pointsScoring.test.cjs:446`](../../mockup-prototipo/tests/pointsScoring.test.cjs#L446)
