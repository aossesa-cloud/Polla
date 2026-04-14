# API Contracts

Base local esperada: `http://localhost:3030`

## Convenciones generales

- Todas las respuestas exitosas importantes devuelven `loadData()` completo o un objeto JSON derivado.
- Los errores comunes responden `400` o `500` con:

```json
{
  "error": "Mensaje visible",
  "detail": "Detalle tecnico opcional"
}
```

## Endpoints

### `GET /api/data`

Uso:
- Obtener el snapshot consolidado del sistema.

Respuesta:
- Objeto completo de dominio construido por `loadData()`.

### `POST /api/events/:eventId/participants`

Uso:
- Guardar o actualizar un pronostico individual.

Body esperado:

```json
{
  "index": 1,
  "name": "TRINIDAD",
  "picks": ["7", "3", "5"]
}
```

Respuesta:
- Snapshot completo actualizado.

### `DELETE /api/events/:eventId/participants/:index`

Uso:
- Eliminar pronostico de un participante por indice.

Respuesta:
- Snapshot completo actualizado.

### `POST /api/events/:eventId/results/:race`

Uso:
- Guardar un resultado puntual por carrera.

Body esperado:
- Payload libre compatible con el modelo interno de resultado.

Respuesta:
- Snapshot completo actualizado.

### `POST /api/events/:eventId/meta`

Uso:
- Guardar metadatos de jornada.

Body esperado:

```json
{
  "raceCount": 23
}
```

Respuesta:
- Snapshot completo actualizado.

### `POST /api/events/copy-results`

Uso:
- Copiar resultados desde una jornada origen a una o mas jornadas destino.

Body esperado:

```json
{
  "sourceEventId": "campaign-daily-1775342689043",
  "targetEventIds": ["weekly-1775342799912-sabado"]
}
```

Respuesta:
- Snapshot completo actualizado.

### `POST /api/operations/batch`

Uso:
- Aplicar una misma carga a varias jornadas.

Body esperado:

```json
{
  "targetEventIds": ["event-a", "event-b"],
  "participant": {
    "index": 1,
    "name": "TRINIDAD",
    "picks": ["7", "3", "5"]
  }
}
```

o

```json
{
  "targetEventIds": ["event-a", "event-b"],
  "result": {
    "race": "1",
    "primero": "9",
    "ganador": "5.30"
  }
}
```

Respuesta:
- Snapshot completo actualizado.

### `GET /api/import/teletrak/tracks?date=YYYY-MM-DD`

Uso:
- Consultar hipodromos disponibles para una fecha.

Respuesta:

```json
{
  "date": "2026-04-04",
  "tracks": [
    {
      "id": 3532,
      "raceCardId": 0,
      "name": "Hipodromo",
      "countryCode": "CL",
      "breedType": "..."
    }
  ]
}
```

### `POST /api/import/teletrak/results`

Uso:
- Importar resultados desde Teletrak a jornadas destino.

Body esperado:

```json
{
  "date": "2026-04-04",
  "trackId": 3532,
  "targetEventIds": ["campaign-daily-1775342689043"]
}
```

Respuesta:
- Snapshot completo actualizado.
- Incluye `importSummary`.

### `POST /api/admin/registry`

Uso:
- Alta o actualizacion del padron maestro.

Body esperado:

```json
{
  "name": "TRINIDAD",
  "diaria": true,
  "semanal": true,
  "mensual": true,
  "group": "A"
}
```

Respuesta:
- Snapshot completo actualizado.

### `POST /api/admin/unlock`

Uso:
- Validar PIN administrativo.

Body esperado:

```json
{
  "pin": "1234"
}
```

Respuesta:

```json
{
  "ok": true
}
```

### `POST /api/admin/settings`

Uso:
- Persistir configuracion parcial.

Body esperado:
- Objeto parcial compatible con `settings`.

Respuesta:
- Snapshot completo actualizado.

### `POST /api/admin/campaigns/:kind/:id/action`

Parametros:
- `kind`: `daily`, `weekly`, `monthly`
- `action`: `activate`, `deactivate`, `delete`, `clear-data`

Body esperado:

```json
{
  "action": "activate"
}
```

Respuesta:
- Snapshot completo actualizado.

## Observaciones de contrato

- No existe versionado de API.
- No existe validacion de esquema formal.
- Los payloads se basan en convenciones del frontend actual.
- La API esta pensada para un cliente propio y local, no para terceros.
