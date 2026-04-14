# Component Inventory

## Backend modules

### `server.js`

Rol:
- Punto de entrada del servidor.
- Router HTTP central.

Entradas:
- Requests JSON desde navegador.

Salidas:
- JSON consolidado.
- Mutaciones persistidas en `overrides.json`.

### `parser.js`

Rol:
- Componer el modelo de dominio final.

Responsabilidades principales:
- Leer workbooks.
- Parsear jornadas y tabla mensual.
- Aplicar scoring.
- Generar eventos sinteticos.
- Construir registry consolidado.

Exporta:
- `loadData()`

### `storage.js`

Rol:
- Persistencia local.

Responsabilidades principales:
- Crear defaults.
- Leer/escribir `overrides.json`.
- Mutar participants, results, meta, registry, campaigns y settings.

Exporta:
- `OVERRIDES_FILE`
- `clearEventData`
- `deleteCampaign`
- `copyEventResults`
- `deleteParticipant`
- `loadOverrides`
- `upsertEventMeta`
- `upsertParticipant`
- `upsertResult`
- `upsertRegistryParticipant`
- `updateCampaign`
- `updateSettings`

### `teletrak.js`

Rol:
- Cliente de integracion con resultados externos.

Exporta:
- `fetchTeletrakRaceResults`
- `fetchTeletrakTracks`
- `matchTeletrakTrack`

## Frontend views

### Navegacion global

Definida en `app-legacy.js`:

- `admin`
- `daily`
- `weekly`
- `monthly`

### Vista Administrador

Capacidades detectadas:

- Unlock por PIN.
- Registro maestro de participantes.
- Creacion y gestion de campañas.
- Configuracion diaria/semanal/mensual.
- Configuracion de premios.
- Carga de pronosticos.
- Carga de resultados.
- Operaciones masivas.
- Importacion Teletrak.
- Limpieza de datos por campaña.

### Vista Diaria

Capacidades detectadas:

- Seleccion de jornada activa.
- Banner oficial.
- Ranking.
- Proxima carrera / carrera foco.
- Distribucion de picks.
- Ledger de resultados.
- Tabla de picks con color por puntaje.

### Vista Semanal

Capacidades detectadas:

- Seleccion de campaña semanal.
- Vista total acumulada.
- Vista por jornada.
- Estructura de torneo.
- Resumen de jornadas activas.
- Tabla oficial y resultados por dia.

### Vista Mensual

Capacidades detectadas:

- Vista total o por jornada.
- Filtro por campañas/eventos seleccionados.
- Ranking acumulado.
- Resultados de jornadas.
- Tabla de picks de jornada.

## Assets y estilos

### `public/index.html`

- Shell base.
- Topbar.
- Nav principal.
- Contenedores de vistas.

### `public/styles.css`

- Sistema visual principal.
- Hero banners.
- Tablas.
- Cards.
- Formularios.
- Layout responsive basico.

## Componentes de datos persistidos

- `events[eventId]`
- `registry[]`
- `settings.daily`
- `settings.weekly`
- `settings.monthly`
- `settings.campaigns`
- `settings.prizes`
- `settings.excel`
- `settings.toteletras`

## Componentes ausentes o incompletos

- No hay sistema de componentes frontend reutilizables por archivo.
- No hay capa de servicios frontend separada.
- No hay repositorio de tests.
- No hay capa de validacion tipada compartida entre cliente y servidor.
