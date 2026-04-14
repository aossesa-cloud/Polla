# Contribution Guide

## Objetivo de esta guia

Esta guia resume como intervenir el proyecto sin perder de vista sus restricciones reales.

## Principios practicos

- Mantener compatibilidad con la operacion local.
- No romper el flujo basado en Excel si sigue activo.
- Preferir cambios pequenos y verificables.
- No asumir que el frontend nuevo ya reemplazo al legacy.

## Donde NO asumir cosas

- No asumir multiusuario.
- No asumir autenticacion real.
- No asumir contratos API estables para terceros.
- No asumir que siempre habra Excel cargado.

## Antes de cambiar algo

1. Revisar `data/overrides.json`.
2. Confirmar si `settings.excel.useExcelBase` esta activo o no.
3. Identificar si el cambio afecta diaria, semanal, mensual o admin.
4. Validar si el cambio vive en backend, parser o frontend legacy.

## Convenciones observadas

- Backend y frontend usan nombres de dominio en espanol.
- Los payloads suelen ser flexibles y poco estrictos.
- El frontend construye HTML con template strings.
- El snapshot global siempre se vuelve a pedir con `loadData()`.

## Buenas practicas para este repo

- Si agregas un endpoint, documentalo en `docs/api-contracts.md`.
- Si cambias estructura persistida, actualiza `docs/data-models.md`.
- Si extraes logica del legacy, deja el flujo funcionando en cada paso.
- Si agregas reglas de scoring, cubrelas con tests antes de mover mas piezas.

## Prioridades tecnicas sugeridas

- Reducir tamaño de `app-legacy.js`.
- Agregar pruebas a `parser.js` y `storage.js`.
- Separar modelos de payload de resultados y participantes.
- Mejorar manejo de errores y validacion de entradas.

## Riesgos a vigilar

- Cambios en el formato de las planillas.
- Escrituras simultaneas al JSON.
- Diferencias entre eventos reales de Excel y eventos sinteticos.
- Casos de empate/retiro/favorito en scoring.

## Checklist rapido para cambios

- La app sigue levantando con `npm start`.
- `GET /api/data` sigue devolviendo snapshot valido.
- Los resultados y picks se recalculan bien.
- No se rompen campañas existentes en `overrides.json`.
- La documentacion relevante queda actualizada.
