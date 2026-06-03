# Flujo Libro Maestro Excel

Este flujo deja Excel como la vista principal del sistema y permite trabajar sin abrir el servidor web local.

## Archivos importantes

- `outputs/Libro Maestro Polla Hipica Compacto.xlsm`: libro macro-habilitado para revisar, cargar, compartir o imprimir.
- `data/overrides.json`: base local donde siguen viviendo campanas, participantes, pronosticos, resultados y programas.
- `scripts/build-excel-master.js`: genera el libro maestro desde la base local.
- `scripts/import-teletrak-once.js`: importa programa/resultados desde Teletrak una vez y guarda en la base local.

## Comandos diarios

Generar el Excel con lo que ya esta guardado:

```powershell
npm run excel:build
```

Procesar pronosticos pegados desde Excel:

```powershell
npm run excel:picks
```

El ingreso queda dentro del mismo libro:

```text
outputs/Libro Maestro Polla Hipica Compacto.xlsm
```

La hoja `Ingreso Picks` funciona como una pantalla de carga parecida a la web: eliges fecha, grupo, campanas destino, participante y pegas los pronosticos en el bloque grande de ingreso automatico. Si necesitas una carga masiva, abajo queda la `TABLA AVANZADA / HISTORIAL`, con el mismo formato tecnico de siempre.

Para cargar desde el panel superior:

1. Cambia `PROCESAR CARGA` a `SI`.
2. Revisa la fecha operativa y marca `SI` en `Diaria`, `Semanal` y/o `Mensual`.
3. Completa `Stud 1` y, si corresponde, `Stud 2`.
4. Pega los picks en `INGRESO AUTOMATICO`.
5. Presiona el boton `Guardar Picks Rapido` dentro del `.xlsm` para guardar sin cerrar ni regenerar todo.

Para refrescar tablas, pronosticos visibles y rankings, usa `Regenerar Libro` cuando termines una tanda de ingresos. Si quieres hacer ambos pasos desde consola, ejecuta `npm run excel:picks`.

Formatos soportados en `Pegado Stud 1` / `Pegado Stud 2`:

```text
5 7 9 2 1
```

```text
1. 5
2. 7
3. 9
```

```text
1. 5-12
2. 7-4
3. 9-2
```

En el formato doble, el primer numero va a `Stud 1` y el segundo numero va a `Stud 2`. Tambien puedes llenar manualmente las columnas `C1` a `C30` para el primer stud y `D1` a `D30` para el segundo.

Actualizar Teletrak y regenerar el Excel:

```powershell
npm run excel:update
```

Actualizar una fecha especifica:

```powershell
node scripts/import-teletrak-once.js --date=2026-05-05
npm run excel:build
```

Actualizar solo un hipodromo:

```powershell
node scripts/import-teletrak-once.js --date=2026-05-05 --track=chs
npm run excel:build
```

Probar la conexion sin escribir cambios:

```powershell
node scripts/import-teletrak-once.js --date=2026-05-05 --track=chs --dry-run
```

Hipodromos soportados por el comando:

- `chs`
- `hipodromo-chile`
- `valparaiso`
- `concepcion`

## Hojas del Libro Maestro Compacto

- `Panel`: resumen operativo, campanas activas e indicadores.
- `Campañas`: valores base, campanas, entradas, promos, premios y padron de participantes.
- `Ingreso Picks`: pantalla inteligente para pegar pronosticos, enviarlos a varias campanas y revisar el estado de importacion.
- `Programa`: carreras, horarios, ejemplares y jinetes.
- `Resultados`: tabla oficial por fecha/carrera con primero, segundo, tercero, dividendos por posicion, favorito, retirados, estado, fuente y bloqueo manual.
- `Pronosticos`: tabla ancha de picks y validacion por carrera en una sola hoja.
- `Ranking`: premios, ranking diario, ranking semanal y ranking mensual en una sola hoja.

## Criterio de diseno

El libro no reemplaza la base local: la ordena en un formato familiar de Excel. La web puede seguir existiendo como panel opcional, pero el uso diario queda centrado en generar o actualizar el workbook.

La importacion automatica sin servidor funciona como una corrida puntual. Si se quiere que revise carreras cada minuto durante toda la jornada, eso requiere dejar corriendo algun proceso de fondo; puede ser un comando aparte, una tarea programada de Windows o una macro que llame al comando.
