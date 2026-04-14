# Nuevas - Documentacion del Proyecto

Fecha de generacion: 2026-04-08
Proyecto: `Nuevas`
Tipo detectado: aplicacion web full-stack local en Node.js con frontend estatico y backend Express

## Resumen rapido

Este proyecto centraliza la operacion de pollas hipicas usando dos fuentes:

- Archivos Excel como base historica y operativa.
- Persistencia local en JSON para campañas, pronosticos, resultados y configuracion.

La aplicacion corre en local, sirve una SPA ligera desde `public/`, expone APIs JSON desde `server.js` y compone el modelo final en tiempo real con `parser.js` + `storage.js`.

## Mapa de lectura recomendado

1. [PRD.md](./PRD.md)
2. [project-overview.md](./project-overview.md)
3. [architecture.md](./architecture.md)
4. [api-contracts.md](./api-contracts.md)
5. [data-models.md](./data-models.md)
6. [technical-context-handoff.md](./technical-context-handoff.md)
7. [component-inventory.md](./component-inventory.md)
8. [development-guide.md](./development-guide.md)
9. [source-tree-analysis.md](./source-tree-analysis.md)
10. [contribution-guide.md](./contribution-guide.md)

## Hallazgos clave

- La app ya es operable y no esta en etapa puramente experimental.
- El frontend nuevo aun no existe como reescritura real: `public/app.js` delega todo a `public/legacy/app-legacy.js`.
- La logica de negocio mas importante vive en `parser.js`, `storage.js`, `teletrak.js` y el backend Express.
- La persistencia principal del trabajo manual esta en `data/overrides.json`.
- No se detectaron pruebas automatizadas reales ni configuracion formal de despliegue/CI.

## Para seguir trabajando

- Si quieres cambiar comportamiento de negocio, empieza por `parser.js` y `storage.js`.
- Si quieres tocar interfaz, hoy el punto real de trabajo es `public/legacy/app-legacy.js`.
- Si quieres modernizar el proyecto, la deuda principal es separar frontend legacy en modulos pequeños.
