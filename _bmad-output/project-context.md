# Contexto del Proyecto

## 1. Qué es este proyecto

Este proyecto es un panel local para administrar una **polla hípica** con soporte para:

- campañas `diaria`
- campañas `semanal`
- campañas `mensual`
- ingreso de picks
- resultados por jornada
- tabla de pronósticos
- ranking
- premios
- exportación/copia de PNG
- estilos visuales por campaña

La aplicación ya no depende solo de Excel para operar. Los Excel siguen siendo una fuente histórica/referencia, pero el sistema trabaja principalmente con datos persistidos localmente.

## 2. Stack y runtime

### Frontend

- React 18
- Vite 6
- Zustand
- `html2canvas` para copiar/exportar imágenes

Ruta principal:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo)

### Backend / parser local

- Node.js
- Express
- `xlsx`

Archivos principales:

- [D:\56974\Documents\Tablas\Nuevas\server.js](D:\56974\Documents\Tablas\Nuevas\server.js)
- [D:\56974\Documents\Tablas\Nuevas\parser.js](D:\56974\Documents\Tablas\Nuevas\parser.js)
- [D:\56974\Documents\Tablas\Nuevas\storage.js](D:\56974\Documents\Tablas\Nuevas\storage.js)

### Persistencia

- overrides y estado operacional:
  - [D:\56974\Documents\Tablas\Nuevas\data\overrides.json](D:\56974\Documents\Tablas\Nuevas\data\overrides.json)
- relaciones auxiliares frontend:
  - `localStorage`
  - claves importantes:
    - `pollas-promo-relations`
    - `pollas-participant-relations`

## 3. Cómo correrlo

### Backend

Desde:

- [D:\56974\Documents\Tablas\Nuevas](D:\56974\Documents\Tablas\Nuevas)

Comandos:

```powershell
npm start
```

o

```powershell
node server.js
```

### Frontend

Desde:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo)

Comandos:

```powershell
npm run dev
```

Build:

```powershell
npm run build
```

## 4. Arquitectura funcional actual

### 4.1 Campañas

Las campañas viven en settings/campaigns y pueden ser:

- `diaria`
- `semanal`
- `mensual`

Archivos clave:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\CampaignWizard.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\CampaignWizard.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useCampaigns.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useCampaigns.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignEligibility.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignEligibility.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignStatus.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignStatus.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignModeConfig.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignModeConfig.js)

### 4.2 Eventos / jornadas

Las jornadas/eventos se guardan como eventos normales, pero semanal/mensual usan ids explícitos por campaña y fecha, por ejemplo:

- `campaign-monthly-<campaignId>-YYYY-MM-DD`
- `campaign-weekly-<campaignId>-YYYY-MM-DD`

Regla importante:

- `diaria` puede usar más fallback por fecha
- `semanal` y `mensual` deben depender de **pertenencia explícita a la campaña**

Esto es crítico para no mezclar data entre campañas del mismo rango.

### 4.3 Tabla de pronósticos

Base reutilizable:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTable.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTable.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTableContainer.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTableContainer.jsx)

Agrupación por modo:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\competitionTableSections.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\competitionTableSections.js)

### 4.4 Ranking

El ranking diario de `diaria` sigue una ruta más clásica.

Para `semanal` y `mensual`, el punto central ahora es:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useRanking.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useRanking.js)

Motor:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\rankingEngine.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\rankingEngine.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\phaseManager.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\phaseManager.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\modeEngine.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\modeEngine.js)

UI:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\ranking\RankingContainer.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\ranking\RankingContainer.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\RankingTable.module.css](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\RankingTable.module.css)

### 4.5 Detalle de campaña

El modal de campaña concentra:

- pronósticos
- participantes
- ranking
- premios
- resultados

Archivo crítico:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\campaigns\CampaignDetailModal.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\campaigns\CampaignDetailModal.jsx)

Este archivo tiene mucha lógica y varios fallbacks. Tócalo con cuidado.

## 5. Estado actual por tipo de campaña

### Diaria

Está funcional y es la ruta más estable.

No conviene tocar su lógica principal salvo que sea estrictamente necesario.

### Mensual

Estado actual:

- jornadas derivadas desde calendario seleccionado
- filtros por hipódromo corregidos
- picks por jornada explícita
- tabla de pronósticos por fecha funcionando
- ranking total + ranking por jornada funcionando
- premios por campaña funcionando

Puntos delicados:

- antes mezclaba eventos por fecha; eso ya se corrigió
- el detalle de campaña usa fallback local si `useRanking` no trae jornadas

### Semanal

Estado actual:

- ya no debe heredar información de mensual
- el ranking vacío en una semanal nueva es correcto
- el conteo de participantes disponibles ya quedó estricto por pertenencia real a la campaña
- el wizard ya guarda configuración semanal más autosuficiente

Pendiente natural:

- QA más profunda con campañas reales de cada modo

## 6. Modos de competencia semanales

### Estado general

Se implementó una base reutilizable para los modos semanales sin duplicar tabla ni ranking.

Fuente de verdad:

- `campaign.modeConfig`

### Modos con base funcional implementada

1. `individual`
2. `final-qualification`
3. `pairs`
4. `groups`
5. `head-to-head`
6. `progressive-elimination`

### Qué ya quedó integrado

- `modeConfig` por campaña
- relaciones por campaña para:
  - pareja
  - grupo
  - contrincante
- tabla agrupada por modo
- ranking adaptado por modo
- clasificación/final/eliminación base por motor común

### Archivos clave del trabajo de modos

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignModeConfig.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\services\campaignModeConfig.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useParticipantRelations.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useParticipantRelations.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\picks\PickEntry.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\picks\PickEntry.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\picks\PickForm.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\picks\PickForm.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTableContainer.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTableContainer.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useRanking.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useRanking.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\phaseManager.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\phaseManager.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\ranking\RankingContainer.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\ranking\RankingContainer.jsx)

## 7. Reglas de negocio críticas

### 7.1 Inscripción semanal/mensual

Regla:

- en semanal/mensual, después del primer día activo solo deben seguir cargando picks los participantes inscritos desde el primer día

Esto pasa por:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useCampaignParticipants.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useCampaignParticipants.js)

### 7.2 Pertenencia explícita a campaña

Regla:

- `semanal` y `mensual` no deben tomar eventos “solo porque coincide la fecha”

Solo `diaria` puede usar fallback por fecha.

Esto afecta directamente:

- participantes disponibles
- tabla de pronósticos
- ranking
- premios
- resultados

### 7.3 Última carrera x2

Regla:

- la última carrera doble debe salir de la **última carrera real**, no de una columna vacía sobrante

### 7.4 Empates en resultados

Ya hay soporte para empates, incluyendo:

- empate en 2°
- empate en 3°
- visualización de dividendos separados
- scoring alineado con el empate

Archivos sensibles:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useJornada.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useJornada.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\ResultadosJornada.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\ResultadosJornada.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\scoreEngine.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\scoreEngine.js)

### 7.5 Premios

Regla actual:

- la configuración editable se hace desde la pestaña `Premios` de la campaña
- la pantalla global de premios debe reflejar lo configurado en la campaña, no competir con ella

## 8. Reglas de frontend que otro agente debe respetar

1. No duplicar componentes base de tabla/ranking si se puede resolver desde capa de datos.
2. Si se toca semanal/mensual, validar que no se rompa `diaria`.
3. Si se cambia backend en:
   - [D:\56974\Documents\Tablas\Nuevas\server.js](D:\56974\Documents\Tablas\Nuevas\server.js)
   - [D:\56974\Documents\Tablas\Nuevas\parser.js](D:\56974\Documents\Tablas\Nuevas\parser.js)
   hay que reiniciar Node.
4. Si se cambia solo frontend, normalmente basta con Vite + refresh.
5. El proyecto usa `.editorconfig` con UTF-8. No volver a introducir problemas de codificación.

## 9. Archivos más delicados

Estos archivos concentran mucha lógica y merecen lectura cuidadosa antes de tocar:

- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\campaigns\CampaignDetailModal.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\campaigns\CampaignDetailModal.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useRanking.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useRanking.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useCampaignParticipants.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\hooks\useCampaignParticipants.js)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTableContainer.jsx](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\components\tables\PicksTableContainer.jsx)
- [D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\phaseManager.js](D:\56974\Documents\Tablas\Nuevas\mockup-prototipo\src\engine\phaseManager.js)

## 10. Pendientes recomendados

### Prioridad alta

- QA manual por modo semanal con campañas reales:
  - `pairs`
  - `groups`
  - `head-to-head`
  - `progressive-elimination`

### Prioridad media

- limpiar deuda técnica de fallbacks en `CampaignDetailModal.jsx`
- seguir reduciendo dependencias legacy a `settings.weekly`

### Prioridad baja

- mejorar chunking del frontend
- ampliar pruebas automatizadas

## 11. Estado de build al cierre de este contexto

- Frontend:
  - `npm run build` OK
- Advertencia vigente:
  - bundle grande de Vite

## 12. Resumen corto para otro agente

Si otro agente toma esto, la guía rápida es:

1. Leer primero:
   - `useRanking.js`
   - `CampaignDetailModal.jsx`
   - `useCampaignParticipants.js`
   - `campaignEligibility.js`
2. Asumir que:
   - `diaria` es la ruta más estable
   - `semanal` y `mensual` deben trabajar por pertenencia explícita a campaña
3. Si toca modos semanales:
   - revisar `modeConfig`
   - revisar relaciones por campaña
   - no volver a usar lógica global semanal salvo fallback muy controlado
4. Si algo de campaña parece “vacío” pero la campaña sí tiene jornadas:
   - revisar si la vista está consumiendo `useRanking`
   - y si tiene fallback local en `CampaignDetailModal`
