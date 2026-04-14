# Panel de Pollas Hipicas

Este proyecto deja tus planillas `DIARIA Y SEMANAL.xlsm` y `POLLA MENSUAL.xlsx` visibles en un solo panel local.

## Como usarlo

1. Abre una terminal en `D:\56974\Documents\Tablas\Nuevas`
2. Ejecuta `npm install` si aun no existe la carpeta `node_modules`
3. Ejecuta `npm start`
4. Abre `http://localhost:3030`

## Que muestra

- Jornadas diarias, semanales y mensuales en una sola interfaz
- Ranking por jornada
- Resultados de carreras
- Pronosticos cargados por stud
- Programa semanal
- Vista resumida de la tabla mensual

## Segunda etapa

- Registro de pronosticos desde la misma web
- Registro de resultados desde la misma web
- Recalculo de puntajes usando los dividendos guardados
- Persistencia local en `data/overrides.json` sin modificar los Excel originales

## Idea para el siguiente paso

El siguiente avance natural es agregar una pantalla de ingreso para cargar pronosticos y resultados sin tocar Excel, y dejar Excel solo como respaldo o exportacion.
