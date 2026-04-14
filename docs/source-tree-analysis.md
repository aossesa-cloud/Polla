# Source Tree Analysis

## Vista general

```text
Nuevas/
|- README.md
|- package.json
|- package-lock.json
|- server.js
|- parser.js
|- storage.js
|- teletrak.js
|- DIARIA Y SEMANAL.xlsm
|- POLLA MENSUAL.xlsx
|- data/
|  \- overrides.json
|- public/
|  |- index.html
|  |- app.js
|  |- styles.css
|  \- legacy/
|     \- app-legacy.js
|- docs/
|  |- index.md
|  |- project-overview.md
|  |- architecture.md
|  |- api-contracts.md
|  |- data-models.md
|  |- component-inventory.md
|  |- development-guide.md
|  |- source-tree-analysis.md
|  \- contribution-guide.md
|- _bmad/
|- _bmad-output/
|- design-artifacts/
|- .agents/
|- .agent/
|- .kiro/
|- .qwen/
|- .playwright-cli/
\- node_modules/
```

## Directorios criticos

### Raiz aplicativa

- `server.js`: entrypoint del backend y exposicion de endpoints.
- `parser.js`: lectura de Excel, normalizacion, scoring y armado del modelo final.
- `storage.js`: persistencia local y mutaciones de overrides.
- `teletrak.js`: integracion con la API remota de resultados.

### Datos de negocio

- `data/overrides.json`: estado persistido del sistema.
- `DIARIA Y SEMANAL.xlsm`: base Excel de diaria/semanal.
- `POLLA MENSUAL.xlsx`: base Excel de mensual.

### Frontend

- `public/index.html`: shell principal.
- `public/styles.css`: estilos globales.
- `public/app.js`: entrada nueva, hoy solo redirige a legacy.
- `public/legacy/app-legacy.js`: implementacion real de UI y flujos.

### Infraestructura de asistencia

- `_bmad/`: skills, workflows y configuracion BMAD/WDS.
- `docs/`: documentacion operativa del proyecto.

## Archivos heredados o satelites

- `teletrak_home.html`, `teletrak_results.html`, `teletrak_main.js`: parecen artefactos de exploracion o soporte manual para Teletrak.
- `design-artifacts/`: reservado para artefactos de diseno, sin rol central actual detectado.

## Patrones de organizacion

- Backend minimalista con todo en pocos archivos.
- Frontend monolitico, pero encapsulado en un namespace de archivo legacy.
- Persistencia sin base de datos: JSON local como fuente editable.
- Modelo de datos materializado on-demand desde lectura de Excel + overrides.

## Oportunidades de reorganizacion

- Separar `app-legacy.js` por vistas y servicios.
- Mover endpoints a modulo `routes/` o `api/`.
- Extraer tipos/documentacion de payloads a archivos dedicados.
- Aislar logica de scoring y parsing en modulos pequeños testeables.
