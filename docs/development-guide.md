# Development Guide

## Requisitos

- Node.js 20+ recomendado
- npm
- Acceso local a los archivos Excel del proyecto

## Instalacion

Desde la raiz del proyecto:

```powershell
npm install
```

## Ejecucion local

```powershell
npm start
```

Luego abrir:

```text
http://localhost:3030
```

## Flujo de datos en desarrollo

### Modo con Excel base

Activar en `data/overrides.json`:

```json
{
  "settings": {
    "excel": {
      "useExcelBase": true
    }
  }
}
```

Con eso `loadData()` intenta leer:

- `DIARIA Y SEMANAL.xlsm`
- `POLLA MENSUAL.xlsx`

### Modo sin Excel base

Si `useExcelBase` es `false`, el sistema puede seguir operando con campañas y overrides sinteticos.

## Archivos donde trabajar segun objetivo

### Si quieres cambiar logica de negocio

- `parser.js`
- `storage.js`
- `teletrak.js`

### Si quieres cambiar API

- `server.js`

### Si quieres cambiar interfaz

- `public/legacy/app-legacy.js`
- `public/styles.css`
- `public/index.html`

### Si quieres migrar el frontend

- Empezar en `public/app.js`
- Ir extrayendo secciones de `public/legacy/app-legacy.js`

## Pruebas

Script existente:

```powershell
npm test
```

Importante:

- Hoy no es una suite real.
- Solo intenta ejecutar `loadData()` y mostrar conteos.
- En este entorno de trabajo fallo por restricciones de permisos/sandbox al resolver rutas del disco.

## Consideraciones de desarrollo

- No hay base de datos: todo se guarda en `data/overrides.json`.
- No hay migraciones.
- No hay tipado TypeScript.
- No hay lint ni formatter configurados por npm.
- No hay CI detectado.

## Refactors recomendados

- Extraer `server.js` en modulos `routes` y `services`.
- Partir `parser.js` en parseo, scoring y synthetic events.
- Dividir `app-legacy.js` por vistas.
- Agregar pruebas unitarias para scoring y overrides.
- Normalizar encoding de textos para evitar mojibake.

## Integracion Teletrak

La integracion usa `fetch()` del runtime Node. Si cambias la estructura de la API remota:

- revisa `fetchTeletrakTracks()`
- revisa `fetchTeletrakRaceResults()`
- revisa `mapRaceResult()`

## Documentacion relacionada

- [architecture.md](./architecture.md)
- [api-contracts.md](./api-contracts.md)
- [data-models.md](./data-models.md)
