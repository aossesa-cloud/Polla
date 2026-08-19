# Deferred work

- `mockup-prototipo/src/engine/scoreEngine.js:59` -- La última carrera doble se determina con la última carrera que tenga resultado o pick significativo. Si una jornada tiene carreras finales todavía vacías, una carrera anterior podría recibir el doble antes de tiempo. Es un comportamiento previo a este arreglo y requiere definir cómo propagar siempre el total de carreras configurado al motor.
