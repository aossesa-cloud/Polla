# Project Overview

## Objetivo

`Nuevas` es un panel local para administrar pollas hipicas diarias, semanales y mensuales. Toma planillas Excel como base, permite complementar o reemplazar datos desde la web y recalcula posiciones en una sola interfaz.

## Problema que resuelve

Antes, la operacion dependia de Excel para:

- Participantes.
- Pronosticos.
- Resultados.
- Tablas y acumulados.

El proyecto agrega una capa de control local para:

- Ver jornadas y campañas desde una sola UI.
- Registrar pronosticos y resultados sin editar Excel.
- Copiar/importar resultados entre jornadas.
- Mantener configuracion, premios y padron maestro.
- Trabajar con campañas sinteticas aun cuando Excel no sea la base activa.

## Alcance funcional actual

### Vistas principales

- Administrador
- Diaria
- Semanal
- Mensual

### Capacidades implementadas

- Lectura de `DIARIA Y SEMANAL.xlsm`.
- Lectura de `POLLA MENSUAL.xlsx`.
- Mezcla de datos base con overrides persistidos.
- Manejo de scoring por dividendos o por puntos.
- Soporte para empates, retiros y favorito.
- Gestion de campañas diarias, semanales y mensuales.
- Registro maestro de participantes.
- Carga masiva de pronosticos y resultados a varias jornadas.
- Copia de resultados desde una jornada origen.
- Importacion de hipodromos y resultados desde Teletrak.

## Estado actual del producto

El sistema esta en una etapa intermedia:

- El backend y la logica de negocio ya estan maduros para uso local.
- La experiencia visual esta operativa.
- La migracion a una nueva arquitectura frontend todavia no se concreta.

En la practica, el proyecto funciona, pero sigue apoyandose en un archivo frontend legacy grande.

## Stack detectado

- Runtime: Node.js
- Backend: Express 5
- Frontend: HTML/CSS/JS vanilla
- Lectura Excel: `xlsx`
- Persistencia local: JSON en disco
- Integracion externa: API de resultados Teletrak

## Dependencias npm

- `express@^5.2.1`
- `xlsx@^0.18.5`

## Scripts disponibles

- `npm start`: inicia el servidor local en puerto `3030` por defecto.
- `npm test`: smoke test basico para ejecutar `loadData()`.

## Riesgos y deuda tecnica visibles

- `public/legacy/app-legacy.js` concentra demasiada responsabilidad.
- No hay suite de pruebas automatizadas real.
- No hay esquema formal de despliegue.
- Hay senales de problemas de codificacion de caracteres en textos legados.
- La seguridad administrativa depende de un PIN local guardado en JSON.
