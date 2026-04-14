# Contexto Tecnico de Handoff

Fecha de actualizacion: 2026-04-10
Proyecto: `Nuevas`
Objetivo del documento: entregar a otro agente una explicacion clara del sistema actual, su modelo de datos, sus integraciones y el estado real del desarrollo.

## 1. Descripcion general del sistema

### Que problema resuelve

El sistema reemplaza la operacion manual y ambigua de pollas hipicas basada en planillas, mensajes y revisiones manuales por una plataforma unica donde se puede:

- cargar programas de carreras por fecha e hipodromo
- registrar pronosticos por participante
- registrar o importar resultados oficiales
- recalcular puntajes y rankings automaticamente
- administrar campanas diaria, semanal y mensual

La idea principal del producto es separar tres cosas que antes estaban mezcladas:

- el programa del dia
- los resultados reales de la jornada
- la participacion de cada stud dentro de una o varias campanas

### Flujo principal

El flujo operativo e sperado es:

1. Se define una jornada por `fecha + hipodromo`.
2. Se carga el programa de carreras de esa jornada.
3. Se cargan pronosticos de los participantes dentro de campanas activas.
4. Se cargan o importan resultados oficiales de la jornada.
5. El sistema reconcilia programa, pronosticos y resultados.
6. Se recalculan rankings y tablas oficiales.

En terminos simples:

`Pronosticos -> Resultados -> Ranking`

## 2. Arquitectura actual

### Estructura general

La app es una aplicacion local en Node.js con Express y frontend estatico:

- `server.js`: API REST JSON + servidor de archivos estaticos
- `parser.js`: motor de composicion y reglas de negocio
- `storage.js`: persistencia local en `data/overrides.json`
- `teletrak.js`: integracion con Teletrak
- `public/legacy/app-legacy.js`: frontend real en produccion

La aplicacion no usa base de datos relacional. La fuente editable principal es un archivo JSON local.

### Concepto de jornadas

La unidad tecnica mas importante del sistema es la `jornada`.

Una jornada representa una reunion real de carreras definida por:

- `fecha`
- `hipodromo`

Sobre esa jornada viven los datos operativos reales:

- programa del dia
- resultados por carrera
- metadatos de la jornada

La jornada es independiente de las campanas. Varias campanas pueden apoyarse en la misma jornada si usan esa fecha.

### Campanas

El sistema trabaja con tres tipos de campana:

- `diaria`
- `semanal`
- `mensual`

Cada campana define contexto competitivo, no resultados oficiales. Por ejemplo:

- nombre
- grupo asociado
- scoring
- modalidad
- fechas o jornadas incluidas
- configuracion de premios

Las campanas pueden compartir jornadas. Por eso la fuente de verdad de resultados no debe vivir dentro de una campana.

### Pronosticos ligados a campanas

Los pronosticos se registran como participacion de un stud dentro de una o varias campanas activas para una fecha dada.

Importante:

- el roster visible nace del grupo o de los inscritos ya fijados en la campana
- no todos los studs del grupo tienen que participar en todas las campanas
- el frontend ya permite elegir a que campanas entra un pronostico

### Resultados independientes en jornadas

Los resultados no se guardan por campana. Se guardan por jornada.

Eso significa:

- si una fecha tiene una diaria y una mensual activas, ambas usan el mismo resultado real
- el sistema replica esos resultados a todas las campanas que incluyan esa jornada
- esto evita duplicacion y desincronizacion

## 3. Modelo de datos

### Estructura raiz persistida

El archivo `data/overrides.json` se normaliza desde `storage.js` con esta forma conceptual:

```json
{
  "events": {},
  "registry": [],
  "programs": {},
  "settings": {}
}
```

### `events`

`events` guarda overrides y datos operativos por evento sintetico. En la practica, se usa para:

- `participants`
- `results`
- `meta`

Los eventos sinteticos son construidos por `parser.js` a partir de las campanas diaria, semanal y mensual.

### `registry`

Es el padron maestro de participantes. Cada entrada puede incluir:

- nombre
- grupo
- flags de pertenencia historica o de modalidades

Ademas, `settings.registryGroups` define los grupos formales disponibles.

### `programs`

`programs` es el almacenamiento de programas del dia. Se indexa con una clave:

`date::trackId`

Cada programa contiene la cartilla de carreras y ejemplares de una jornada real.

Forma conceptual:

```json
{
  "2026-04-09::hipodromo-chile": {
    "date": "2026-04-09",
    "trackId": "hipodromo-chile",
    "trackName": "Hipodromo Chile",
    "races": [
      {
        "raceNumber": 1,
        "title": "Nombre de carrera",
        "runners": [
          {
            "number": "1",
            "name": "ATACAMA FLOWER (CHI)",
            "riderName": "Oscar J. Donate Silvera"
          }
        ]
      }
    ]
  }
}
```

### `settings`

`settings` ya no es solo configuracion visual. Hoy concentra:

- `adminUsers`
- `automation`
- `themes`
- `campaigns.daily`
- `campaigns.weekly`
- `campaigns.monthly`
- `excel.useExcelBase`
- `prizes`
- `registryGroups`

### Estructura de jornada

Aunque la jornada no existe como entidad aislada unica en storage, conceptualmente se compone de:

1. `programa`
2. `resultados`
3. `meta`

#### Programa

Viene de `programs[date::trackId]` y contiene:

- fecha
- hipodromo
- carreras
- ejemplares por carrera

#### Resultados

Viven dentro del override del evento o de la importacion reconciliada, con campos como:

- `first`
- `second`
- `third`
- dividendos por posicion
- empates
- `favorito`
- `retiros`

#### Meta

Se usa para informacion complementaria por jornada, por ejemplo:

- trackId
- trackName
- campaign metadata asociada
- configuracion auxiliar de la jornada

### Relacion entre jornadas, campanas y participantes

La relacion correcta es:

- la jornada define la realidad externa
- la campana decide si usa esa jornada
- el participante entra a una campana, no a la jornada global
- el pronostico del participante se puntua contra los resultados de la jornada correspondiente

## 4. Fuentes de datos

### Resultados desde API de Teletrak

`teletrak.js` usa endpoints REST de Teletrak para resultados oficiales:

- `GET /api/falcon/v1/results/tracks/{fecha}`
- `GET /api/falcon/v1/results/races/{trackId}/{fecha}`

De ahi salen:

- hipodromos disponibles por fecha
- resultados oficiales por carrera
- posiciones y dividendos oficiales
- retiros cuando ya estan presentes en el snapshot oficial

### Programa desde Teletrak

El programa no se toma de la API REST de resultados. Se toma del canal vivo de Teletrak usando SockJS/STOMP en `teletrak.js`.

Esa integracion reconstruye:

- race cards
- races
- runners
- numero del ejemplar
- nombre del ejemplar
- jinete

### Favoritos desde scraping/canal vivo

El favorito no sale del modelo local ni del API REST de resultados.

Se obtiene desde la fuente de `probables/odds boards` de Teletrak, leyendo el mercado vivo de apuestas.

Regla actual:

- se considera favorito al ejemplar con mayor monto en la columna equivalente a `Ganador`

### Como se combinan

Las tres capas se combinan asi:

1. Programa del dia:
   define que ejemplares existen por carrera
2. Resultados oficiales:
   definen posiciones, dividendos y retiros
3. Favorito:
   se agrega como dato externo del mercado

El sistema no intenta inventar datos faltantes si ya existe una fuente mejor. La prioridad es usar la fuente oficial o la fuente viva correcta segun el caso.

## 5. Reglas de negocio importantes

### Modos de calculo

Cada campana puede puntuar de dos formas:

- `dividend`
- `points`

#### Modo dividend

El pick suma dividendos segun resultado de la carrera:

- 1ro: puede sumar dividendo a ganador, segundo y tercero segun reglas locales
- 2do: puede sumar dividendo a segundo y tercero
- 3ro: puede sumar dividendo a tercero

La logica exacta vive en `calculatePickScore()` dentro de `parser.js`.

#### Modo points

El pick usa una tabla fija:

- `first`
- `second`
- `third`
- `exclusiveFirst`

### Ultima carrera doble

`doubleLastRace` aplica en modo `dividend`.

Cuando esta activo:

- la ultima carrera multiplica el puntaje por 2

No aplica en modo `points`.

### Manejo de retiros

Si un ejemplar pronosticado aparece en `retiros`, el sistema usa una defensa:

- si existe `favorito`, el pick defendido pasa a ser el favorito
- si no hay favorito, el pick no puede defenderse con un dato inventado

Esto es importante porque el favorito es un dato externo y debe existir realmente para ser usado como respaldo.

### Favorito como dato externo

El favorito no se calcula desde:

- la tabla de pronosticos
- el puntaje local
- la popularidad interna

Solo se acepta como dato externo proveniente de la fuente de probables/mercado.

## 6. Flujo del sistema

### 1. Carga de programa

El programa se carga por:

- `fecha`
- `hipodromo`

Puede entrar manualmente o importado desde Teletrak.

Ese programa queda guardado en `programs` y luego se usa para:

- mostrar nombres de ejemplares en pronosticos
- validar picks por carrera
- enriquecer piezas visuales

### 2. Carga de resultados

Los resultados se cargan por jornada, no por campana.

Pueden entrar:

- manualmente
- importados desde Teletrak

Al cargarse, quedan disponibles para todas las campanas que usen esa fecha/jornada.

### 3. Reconciliacion programa vs resultados

Cuando el sistema recalcula:

- cruza carreras del programa
- cruza picks de participantes
- cruza posiciones y dividendos del resultado

Si hay retiros y favorito, aplica la defensa.

### 4. Calculo de ranking

Con la reconciliacion lista, `parser.js`:

- puntua pick por pick
- suma por participante
- ordena leaderboard
- construye rankings diarios, semanales y mensuales

En semanal y mensual:

- se calculan tanto tablas por jornada como acumulados

## 7. Decisiones tecnicas clave

### Jornadas como fuente de verdad

Se usa `jornada = fecha + hipodromo` como fuente de verdad porque:

- el resultado real no depende de una sola campana
- varias campanas pueden consumir la misma jornada
- evita duplicar resultados entre diaria, semanal y mensual
- simplifica importacion y sincronizacion

### Por que no se calcula el favorito

No se calcula localmente porque el favorito no es una opinion del sistema. Es un dato de mercado.

Calcularlo desde:

- picks internos
- ranking local
- cantidad de jugadores de la app

seria incorrecto y rompería la logica de defensa por retiro.

### Uso de fallback solo como respaldo

Los fallbacks se usan solo cuando ayudan a no romper operacion, pero no para inventar verdad de negocio.

Ejemplos:

- si falta un nombre de ejemplar, se puede mostrar solo el numero
- si falta favorito, no se inventa
- si falta programa, se puede seguir cargando resultado, pero se pierde enriquecimiento visual

## 8. Estado actual del desarrollo

### Ya implementado

- backend local con Express
- persistencia en JSON via `storage.js`
- motor de composicion y scoring en `parser.js`
- campanas diaria, semanal y mensual
- grupos de padron
- usuarios admin persistidos
- programas del dia persistidos en `programs`
- importacion de resultados desde Teletrak REST
- importacion de programa desde Teletrak vivo
- integracion base de favoritos desde probables/odds boards
- resultados por jornada compartidos entre campanas
- pronosticos ligados a campanas visibles/seleccionadas
- piezas visuales y automatizacion basica de exportacion

### Parcialmente implementado o sensible

- favoritos desde fuente viva, pero con desfase respecto al cierre oficial
- exportacion de imagenes pesadas, especialmente tablas de pronosticos
- UI aun muy concentrada en `public/legacy/app-legacy.js`
- documentacion antigua aun desfasada frente al estado real del codigo

### Falta por implementar o cerrar

- automatizacion por carrera cerrada:
  traer favorito apenas existan posiciones oficiales, sin esperar dividendos completos
- consolidar inscritos fijos por campana semanal/mensual de forma mas explicita
- mejorar estrategia de exportacion de tablas grandes para WhatsApp
- seguir desacoplando frontend legacy en modulos mas pequenos
- limpiar cadenas con problemas de encoding heredadas

## Resumen operativo para otro agente

Si otro agente retoma el desarrollo, la idea clave que debe conservar es esta:

- la jornada real manda
- la campana consume jornadas
- el programa y los resultados no son lo mismo
- el favorito viene de afuera
- el ranking es siempre un dato derivado, no la fuente de verdad

Orden recomendado para entender y tocar el sistema:

1. Leer `storage.js`
2. Leer `parser.js`
3. Leer `teletrak.js`
4. Leer `server.js`
5. Leer `public/legacy/app-legacy.js`

Si hay que cambiar comportamiento de negocio:

- empezar por `parser.js`

Si hay que cambiar persistencia:

- empezar por `storage.js`

Si hay que cambiar integracion con Teletrak:

- empezar por `teletrak.js`

Si hay que cambiar flujo de UI:

- empezar por `public/legacy/app-legacy.js`
