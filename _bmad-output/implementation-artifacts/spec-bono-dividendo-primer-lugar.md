---
title: 'Bono por dividendo alto en aciertos de primero'
type: 'feature'
created: '2026-08-28'
status: 'done'
baseline_commit: '526ea30'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En el modo por puntos el cálculo ignora el dividendo del ejemplar ganador. Se necesita premiar los aciertos de primera posición cuando ese dividendo supera 10.

**Approach:** Sumar automáticamente 3 puntos al acierto de primero que tenga dividendo del ganador estrictamente mayor que 10. La base seguirá siendo el puntaje configurado: exclusivo primero + 3 o primero normal + 3.

## Boundaries & Constraints

**Always:** La regla aplica solo cuando el modo es `points`; el umbral es estrictamente mayor que 10; el bono es exactamente 3 por carrera; se evalúa el dividendo del ejemplar ganador, no la suma de dividendos de colocación; primero exclusivo conserva su puntaje propio antes del bono; primero compartido puede recibir el bono usando su dividendo específico; un retiro defendido usa el dividendo del favorito efectivo; segundos, terceros y dividendos no reciben bono; el motor frontend y el parser deben producir el mismo total; la categoría visual del acierto permanece primero o exclusivo primero.

**Ask First:** Cambiar el umbral, el valor del bono, aplicarlo a otras posiciones o sumar dividendos de colocación requiere aprobación.

**Never:** Alterar el modo por dividendos; reemplazar los puntajes configurados; aplicar el bono cuando el dividendo sea exactamente 10 o esté ausente; modificar colores, orden de ranking o formato PNG; sumar un bono más de una vez por carrera.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Primero normal | Puntos primero 10, ganador 12 | 13 puntos | N/A |
| Primero exclusivo | Exclusivo primero 20, ganador 12 | 23 puntos | N/A |
| Umbral exacto | Ganador 10 | Puntaje configurado sin bono | N/A |
| Sin dividendo | Ganador vacío o inválido | Puntaje configurado sin bono | Trata el dividendo como 0 |
| Segundo/tercero | Pick acierta otra posición con ganador alto | Puntaje normal de su posición | No aplica bono |
| Empate primero | Cada ejemplar tiene dividendo propio | Cada acierto evalúa su propio dividendo | Usa fallback existente si falta dato específico |
| Retiro defendido | Pick retirado se reemplaza por favorito ganador | Usa el dividendo del favorito | Mantiene la defensa actual |
| Última carrera | Puntos con última carrera | Bono una sola vez, sin multiplicador | `doubleLastRace` no aplica en puntos |

</frozen-after-approval>

## Code Map

- `mockup-prototipo/src/engine/scoreEngine.js` -- calcula puntos diarios y conserva categorías por posición.
- `parser.js` -- calcula puntajes importados y debe replicar el bono.
- `mockup-prototipo/src/services/scoringConfig.js` -- normalización compartida del modo y puntajes.
- `mockup-prototipo/tests/pointsScoring.test.cjs` -- pruebas de regla, umbral, empate, retiro y paridad frontend/parser.

## Tasks & Acceptance

**Execution:**
- [x] `mockup-prototipo/src/engine/scoreEngine.js` -- aplicar el bono al primero normal o exclusivo según el dividendo ganador efectivo.
- [x] `parser.js` -- replicar exactamente la regla para datos importados, incluidos empates y retiros.
- [x] `mockup-prototipo/tests/pointsScoring.test.cjs` -- cubrir casos felices, umbral, posiciones excluidas y paridad.

**Acceptance Criteria:**
- Given modo por puntos y un pick de primero con dividendo 10,01, when se calcula, then suma 3 al puntaje de primero.
- Given modo por puntos y un pick exclusivo primero con dividendo mayor que 10, when se calcula, then suma 3 al puntaje exclusivo.
- Given dividendo 10 o menor, when se calcula cualquier primero, then no se agrega bono.
- Given modo dividendo, when se calcula un ganador con dividendo alto, then el resultado de dividendos permanece sin cambios.
- Given frontend y parser con los mismos resultados y picks, when se comparan totales, then coinciden.

## Spec Change Log

## Design Notes

El bono se determina por carrera y por pick ganador. En un empate de primero, cada ejemplar puede tener su propio dividendo; el campo específico del empate tiene prioridad y usa el valor general solo como fallback. La bonificación no cambia `scoreKind`, por lo que los colores existentes siguen identificando la posición acertada.

## Verification

**Commands:**
- `node --test mockup-prototipo/tests/pointsScoring.test.cjs` -- pruebas nuevas y regresiones pasan.
- `npm run build --prefix mockup-prototipo` -- compilación de producción sin errores.

**Manual checks (if no CLI):**
- Cargar una carrera con ganador 10, 10,01 y 12; comprobar que solo 10,01 y 12 agregan 3 en modo puntos y que dividendos no cambian.

## Suggested Review Order

1. [Regla de bonificación en el motor frontend](../../mockup-prototipo/src/engine/scoreEngine.js#L123) -- confirma que solo primero y exclusivo primero suman 3 cuando el dividendo ganador es mayor que 10.
2. [Resolución de dividendo, empates y retiros](../../mockup-prototipo/src/engine/scoreEngine.js#L143) -- revisa aliases, dividendos específicos y el favorito efectivo.
3. [Paridad del parser](../../parser.js#L255) -- verifica que la importación aplique la misma regla y exclusividad.
4. [Cobertura automatizada](../../mockup-prototipo/tests/pointsScoring.test.cjs#L76) -- revisa umbral, exclusivo, empates, retiros, aliases y regresiones.
