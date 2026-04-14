# PRD

## Producto

`Nuevas`

Plataforma moderna para administrar pollas hipicas sin depender de procesos manuales, ambiguos y dispersos.

## Resumen ejecutivo

`Nuevas` debe reemplazar la operacion tradicional basada en planillas, mensajes y validaciones manuales por un sistema unico donde el organizador pueda gestionar campañas, participantes, pronosticos, resultados y tablas de forma clara, rapida y confiable.

La meta no es solo digitalizar una tabla. La meta es profesionalizar la operacion y diferenciar la experiencia.

## Problema

Hoy la administracion de pollas hipicas suele depender de:

- Excel como centro operativo.
- Cargas manuales lentas y propensas a error.
- Ambigüedad sobre reglas, resultados y calculos.
- Informacion fragmentada entre planillas, chats y revisiones manuales.
- Una experiencia poco atractiva para organizadores y jugadores.

Esto genera:

- Perdida de tiempo.
- Mas errores operativos.
- Discusiones evitables.
- Dificultad para escalar.
- Imagen poco profesional.

## Vision

Convertir `Nuevas` en la plataforma de referencia para administrar pollas hipicas de forma moderna, clara y profesional, reemplazando procesos manuales y ambiguos por una experiencia centralizada, confiable y atractiva.

## Objetivo del producto

Crear una plataforma centralizada que permita operar pollas hipicas con reglas claras, datos trazables, calculo automatico y una experiencia visual moderna, dejando Excel como respaldo y no como centro del negocio.

## Usuarios principales

### Organizador / administrador

Necesita:

- Crear campañas.
- Cargar o corregir pronosticos y resultados.
- Mantener control de reglas, premios y jornadas.
- Publicar informacion clara y confiable.

### Participante / jugador

Necesita:

- Ver facilmente como va la competencia.
- Entender que resultados se cargaron.
- Saber por que esta en cierta posicion.

## Propuesta de valor

Con `Nuevas`, una polla hipica deja de depender del caos manual y pasa a funcionar como un sistema serio:

- mas orden
- menos errores
- mas transparencia
- mejor experiencia

## Principios del producto

- Claridad antes que complejidad.
- Operacion rapida antes que burocracia.
- Transparencia en resultados y puntajes.
- Experiencia moderna y diferenciadora.
- Compatibilidad con el flujo actual mientras se reduce la dependencia de Excel.

## Alcance MVP

El MVP debe permitir operar una polla completa desde la plataforma:

- Crear campañas diarias, semanales y mensuales.
- Administrar padron maestro de participantes.
- Registrar pronosticos.
- Registrar o importar resultados.
- Recalcular tablas automaticamente.
- Mostrar vistas oficiales de diaria, semanal y mensual.
- Configurar scoring y reglas principales.
- Persistir todo localmente sin tocar los Excel originales.

## Funcionalidades clave

### Nucleo operativo

- Gestion de campañas.
- Gestion de jornadas y carreras.
- Padron maestro.
- Configuracion de reglas y premios.

### Carga de pronosticos

- Alta, edicion y eliminacion.
- Replicacion a jornadas compatibles.
- Validaciones basicas antes de guardar.

### Carga de resultados

- Registro manual claro por carrera.
- Soporte para empates, retiros y favorito.
- Copia de resultados entre jornadas.
- Importacion desde Teletrak.

### Calculo y transparencia

- Recalculo automatico de puntajes.
- Lectura clara del scoring.
- Rankings por jornada y acumulados.
- Menor espacio para interpretaciones manuales.

### Experiencia oficial

- Vista diaria.
- Vista semanal.
- Vista mensual.
- Tableros listos para comunicar a participantes.

## No objetivos iniciales

- SaaS multiusuario.
- Sistema de pagos.
- Aplicacion movil nativa.
- Operacion en tiempo real con varios administradores.
- API publica para terceros.

## Diferenciadores

- No solo muestra datos: organiza la operacion.
- Reduce ambigüedad y discusiones.
- Tiene identidad de producto propio.
- Puede crecer desde administracion local a experiencia mas completa.

## Metricas de exito

- Menos tiempo para cargar una jornada.
- Menos correcciones manuales.
- Menos discusiones por resultados o puntajes.
- Mas campañas operadas sin editar Excel.
- Mejor percepcion de orden y profesionalismo.

## Roadmap sugerido

### Etapa 1: consolidacion operativa

- campañas
- padron
- pronosticos
- resultados
- rankings y reglas claras

### Etapa 2: modernizacion UX

- mejor experiencia admin
- vistas oficiales mas pulidas
- validaciones mas fuertes
- reduccion del frontend legacy

### Etapa 3: diferenciacion real

- automatizaciones
- identidad visual fuerte
- experiencia mas publica/comercial
- posible separacion entre organizador y jugador

## Estado actual frente al PRD

Ya existe una base funcional importante:

- backend operativo
- parser de Excel
- persistencia local
- campañas y resultados
- integracion Teletrak
- vistas diaria, semanal y mensual

La principal deuda para cumplir la vision completa es:

- reducir ambigüedad visible en la operacion
- ordenar la experiencia de administracion
- sacar al frontend del archivo legacy monolitico
