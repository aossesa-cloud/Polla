# Architecture

## Arquitectura general

La aplicacion sigue un modelo simple de tres capas:

1. `public/` renderiza una SPA ligera en el navegador.
2. `server.js` expone endpoints JSON y sirve archivos estaticos.
3. `parser.js` y `storage.js` construyen el estado real del negocio.

## Flujo principal

```text
Browser
  -> GET /api/data
Express server
  -> loadData()
parser.js
  -> lee overrides.json
  -> opcionalmente lee Excel base
  -> aplica overrides
  -> recalcula puntajes y leaderboards
  -> entrega modelo consolidado
Browser
  -> renderiza vistas diaria / semanal / mensual / admin
```

## Backend

### Responsabilidades de `server.js`

- Servir `public/`.
- Exponer endpoints de consulta y mutacion.
- Validar payloads de forma basica.
- Delegar persistencia a `storage.js`.
- Delegar composicion del modelo a `parser.js`.
- Delegar integracion remota a `teletrak.js`.

### Estilo arquitectonico

- API REST JSON ligera.
- Sin middleware complejo.
- Sin autenticacion formal.
- Sin base de datos.

## Motor de datos

### `parser.js`

Es la pieza mas importante del proyecto. Hace cuatro cosas:

- Lee libros Excel si `settings.excel.useExcelBase` esta activo.
- Interpreta hojas de competicion, programas y tabla mensual.
- Mezcla resultados y participantes con los overrides locales.
- Recalcula puntajes, race headers, synthetic events y leaderboards.

### `storage.js`

Gestiona el archivo `data/overrides.json` como almacenamiento principal editable. Incluye:

- Valores default.
- Altas/ediciones de participantes.
- Altas/ediciones de resultados.
- Metadatos por jornada.
- Campañas.
- Configuracion global.
- Limpieza y borrado.

## Frontend

### Shell actual

- `public/index.html`: layout base.
- `public/styles.css`: visual principal.
- `public/app.js`: entrada minimal.
- `public/legacy/app-legacy.js`: toda la logica real.

### Realidad tecnica

Aunque existe una entrada nueva, el frontend sigue siendo un modulo monolitico. El archivo legacy:

- Mantiene estado global.
- Hace `fetch()` a toda la API.
- Construye HTML como strings.
- Maneja render de admin, diaria, semanal y mensual.
- Controla operaciones masivas e importacion Teletrak.

## Integracion externa

`teletrak.js` consulta:

- listado de hipodromos por fecha
- resultados por hipodromo/fecha

Luego transforma la respuesta a la forma de resultados interna usada por el parser y el frontend.

## Persistencia

La aplicacion usa un solo archivo de estado:

- `data/overrides.json`

Este archivo contiene:

- `events`
- `registry`
- `settings`

No hay lock transaccional ni versionado. La consistencia depende de escrituras secuenciales del proceso Node local.

## Decisiones tecnicas observadas

- Preferencia por simplicidad operativa sobre estructura enterprise.
- Excel se conserva como base compatible con el flujo historico.
- JSON local reduce friccion para administracion y experimentacion.
- El recalculo on-demand evita mantener datos derivados desincronizados.

## Restricciones actuales

- Proyecto pensado para uso local, no multiusuario.
- Sin concurrencia controlada.
- Sin despliegue cloud detectado.
- Sin roles/usuarios mas alla del PIN de admin.
- Alta dependencia del formato actual de los Excel.
