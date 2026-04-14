# Data Models

## Modelo raiz devuelto por `loadData()`

```json
{
  "updatedAt": "ISO date",
  "files": {
    "semanal": "path",
    "mensual": "path"
  },
  "storage": {
    "overridesFile": "path"
  },
  "settings": {},
  "studs": {},
  "registry": [],
  "programa": [],
  "semanal": {},
  "mensual": {}
}
```

## `settings`

Campos principales detectados:

```json
{
  "adminPin": "1234",
  "daily": {
    "defaultView": "actual"
  },
  "weekly": {
    "format": "todos-contra-todos",
    "activeDays": ["Lunes"],
    "finalDays": ["Sabado"],
    "groupSize": 4,
    "qualifiersPerGroup": 2,
    "pairMode": false,
    "showTotalsByDefault": true
  },
  "monthly": {
    "hipodromos": ["Hipodromo Chile"],
    "startDate": "2026-04-04",
    "endDate": "2026-04-30",
    "selectedEventIds": ["monthly-..."],
    "showTotalsByDefault": true
  },
  "toteletras": {
    "username": "",
    "password": "",
    "loginUrl": "https://apuestas.toteletras.cl",
    "pollingEnabled": false,
    "pollingIntervalMinutes": 5,
    "pollingDelayMinutes": 5
  },
  "campaigns": {
    "daily": [],
    "weekly": [],
    "monthly": []
  },
  "excel": {
    "useExcelBase": false
  },
  "prizes": {
    "daily": {},
    "weekly": {},
    "monthly": {},
    "payout": {}
  }
}
```

## Evento de competencia

Forma comun para diaria/semanal/mensual:

```json
{
  "id": "weekly-1775342799912-sabado",
  "type": "semanal",
  "sheetName": "Sabado",
  "title": "Semanal 1",
  "races": 23,
  "raceHeaders": [
    { "col": 3, "label": "1", "number": 1 }
  ],
  "scoring": {
    "mode": "dividend",
    "doubleLastRace": true,
    "points": {
      "first": 10,
      "second": 5,
      "third": 1,
      "exclusiveFirst": 20
    }
  },
  "results": [],
  "participants": [],
  "leaderboard": []
}
```

## Participante

```json
{
  "index": 1,
  "name": "TRINIDAD",
  "points": 0,
  "picks": [
    {
      "race": 1,
      "raceLabel": "1",
      "horse": "7",
      "score": 0
    }
  ]
}
```

## Resultado por carrera

```json
{
  "race": "1",
  "primero": "9",
  "empatePrimero": "",
  "ganador": "5.30",
  "divSegundoPrimero": "3.00",
  "divTerceroPrimero": "1.40",
  "empatePrimeroGanador": "",
  "empatePrimeroDivSegundo": "",
  "empatePrimeroDivTercero": "",
  "segundo": "12",
  "empateSegundo": "",
  "divSegundo": "2.60",
  "divTerceroSegundo": "1.30",
  "empateSegundoDivSegundo": "",
  "empateSegundoDivTercero": "",
  "tercero": "3",
  "empateTercero": "6",
  "divTercero": "1.10",
  "empateTerceroDivTercero": "1.00",
  "favorito": "",
  "retiros": ["5"],
  "retiro1": "",
  "retiro2": ""
}
```

## `registry[]`

Padron maestro consolidado:

```json
{
  "name": "TRINIDAD",
  "diaria": true,
  "semanal": true,
  "mensual": true,
  "source": "admin"
}
```

## `studs`

Listas base extraidas desde Excel:

```json
{
  "semanal": [
    { "number": 1, "name": "TRINIDAD" }
  ],
  "mensual": [
    { "number": 1, "name": "TRINIDAD" }
  ]
}
```

## `programa`

Programa semanal parseado desde hoja `Programa`:

```json
[
  {
    "dayName": "Lunes",
    "entries": [
      {
        "carrera": "1",
        "numero": "7",
        "ejemplar": "Caballo",
        "jinete": "Jinete"
      }
    ]
  }
]
```

## `mensual.tabla`

Tabla de standings mensual desde la hoja `Tabla`:

```json
{
  "headers": ["Dia 1", "Dia 2"],
  "standings": [
    {
      "place": "1",
      "stud": "TRINIDAD",
      "scores": [
        { "label": "Dia 1", "value": 120.5 }
      ]
    }
  ]
}
```

## Estructura de `data/overrides.json`

La persistencia editable contiene:

- `events`: overrides por jornada.
- `registry`: participantes maestros.
- `settings`: configuracion global.

### `events[eventId]`

```json
{
  "participants": [
    {
      "index": 1,
      "name": "TRINIDAD",
      "picks": ["7", "3", "5"]
    }
  ],
  "results": {
    "1": {
      "race": "1",
      "primero": "9"
    }
  },
  "meta": {
    "raceCount": 23,
    "importedFrom": "teletrak"
  }
}
```

## Reglas de dominio observadas

- El scoring puede ser por dividendos o por puntos.
- En dividendos, la ultima carrera puede duplicarse.
- Si un caballo fue retiro y existe favorito, el pick puede defenderse con el favorito.
- Puede haber empates en primero, segundo y tercero con dividendos propios.
- La API y el parser aceptan jornadas sinteticas sin respaldo Excel.
