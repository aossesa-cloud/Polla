# Auto-Importación Inteligente de Programas y Resultados

## Descripción

El sistema ahora importa automáticamente **programas** y **resultados** desde Teletrak usando un sistema inteligente basado en el horario real de cada carrera.

## Funcionamiento

### 1. Importación de Programas (7:00 AM)

**¿Qué hace?**
- Se ejecuta automáticamente cada día a las 7:00 AM
- Consulta todos los hipódromos disponibles en Teletrak para esa fecha
- Importa el programa completo con:
  - Carreras y números
  - Ejemplares y jinetes
  - **Hora de inicio (postTime)** de cada carrera ← **Clave para el sistema inteligente**
- Guarda los programas en el storage local

**⚠️ Importante sobre disponibilidad en Teletrak:**

Teletrak solo expone programas cuando la reunión está **"viva"** (activa o próxima a comenzar). Esto significa:

✅ **Auto-import a las 7 AM**: Generalmente funciona porque para ese momento las reuniones del día ya están activas en Teletrak

❌ **Importación manual de fechas futuras**: Puede fallar con el mensaje *"Teletrak no tiene un programa vivo disponible para esa fecha e hipodromo"* si la reunión aún no está activa

**Sistema de reintentos inteligente:**

El auto-import tiene un sistema de reintentos automático:
- Si a las 7 AM las reuniones aún no están activas, **reintenta cada 10 minutos**
- Máximo **5 reintentos** (hasta 50 minutos)
- Si ya existe un programa guardado, lo salta automáticamente
- Una vez que importa exitosamente, detiene los reintentos

**Ejemplo de logs con reintentos:**
```
⏰ [AUTO-IMPORT] Iniciando importación automática de programas
📋 [AUTO-IMPORT] Hipódromos encontrados: 3
⏳ [AUTO-IMPORT] chs: Reunión aún no activa en Teletrak, reintentaremos después
⏳ [AUTO-IMPORT] hipodromo-chile: Reunión aún no activa en Teletrak, reintentaremos después
🔄 [AUTO-IMPORT] Reintento 1/5 en 10 minutos...

10 minutos después:
✅ [AUTO-IMPORT] chs: 15 carreras importadas
✅ [AUTO-IMPORT] hipodromo-chile: 12 carreras importadas
✨ [AUTO-IMPORT] Completado: 2 importados, 0 ya existían
```

**Hipódromos soportados:**
- **chs**: Club Hípico de Santiago
- **hipodromo-chile**: Hipódromo Chile
- **valparaiso**: Valparaíso Sporting Club
- **concepcion**: Club Hípico de Concepción

### 2. Importación Inteligente de Resultados (Basada en postTime)

**¿Cómo funciona?**

El sistema ahora es **inteligente y eficiente**:

1. **Lee el programa del día** (que tiene los postTime de cada carrera)
2. **Para cada carrera**, programa una verificación **2 minutos después del postTime**
3. **Verifica si la carrera está completa** (`race.complete = true`)
4. **Si NO está completa**, re-verifica **cada 1 minuto** hasta que cierre
5. **Cuando cierra**, importa automáticamente:
   - Posiciones (1°, 2°, 3°)
   - Dividendos (ganador, place, show)
   - Empates
   - Retiros
   - **FAVORITO** (obtenido del mercado de apuestas en tiempo real)

**Ejemplo de flujo:**

```
📅 Programa importado a las 7:00 AM
├─ Carrera 1: 13:30 → Verificación programada a las 13:32
├─ Carrera 2: 14:00 → Verificación programada a las 14:02
├─ Carrera 3: 14:25 → Verificación programada a las 14:27
└─ Carrera 4: 14:50 → Verificación programada a las 14:52

A las 13:32:
  ⏳ [RACE-CHECK] Carrera 1 - Club Hípico (13:30)...
  ⏳ Carrera 1 aún no está completa, re-verificando en 1 min...
  
A las 13:33:
  ✅ [RACE-CHECK] Carrera 1 cerrada! Importando resultados...
  ✨ Carrera 1 importada: 1°=5, Fav=3
```

**Ventajas de este sistema:**

✅ **Preciso**: Verifica exactamente cuando debería cerrar cada carrera  
✅ **Eficiente**: No verifica carreras que aún no están cerca de cerrar  
✅ **Automático**: El favorito se obtiene del mercado de apuestas real  
✅ **Robusto**: Si falla, re-intenta automáticamente cada minuto  
✅ **Completo**: Importa resultados a todas las jornadas activas (diaria, semanal, mensual)

### Horario de operaciones automáticas

| Hora | Acción |
|------|--------|
| **7:00 AM** | Importar programas del día |
| **postTime + 2 min** | Verificar si cada carrera cerró |
| **Cada 1 min** | Re-verificar hasta que la carrera complete |
| **Al cerrar** | Importar resultados + favorito automáticamente |

## Logs del sistema

### Cuando importa programas (7:00 AM):
```
⏰ [AUTO-IMPORT] Iniciando importación automática de programas - 2026-04-10 07:00:00
📋 [AUTO-IMPORT] Hipódromos encontrados: 3
🔄 [AUTO-IMPORT] Importando chs...
✅ [AUTO-IMPORT] chs: 15 carreras importadas

⏱️ [AUTO-IMPORT] Próxima importación en 23h 59min (2026-04-11 07:00:00)
```

### Cuando programa las verificaciones (después de importar programas):
```
📅 [SCHEDULE] Programando verificación de 15 carreras para Club Hípico de Santiago...
⏰ [SCHEDULE] Carrera 1: programada a las 13:30, verificación a las 13:32:00
⏰ [SCHEDULE] Carrera 2: programada a las 14:00, verificación a las 14:02:00
⏰ [SCHEDULE] Carrera 3: programada a las 14:25, verificación a las 14:27:00
```

### Cuando verifica carreras (cada carrera individual):
```
🏁 [RACE-CHECK] Verificando carrera 1 - Club Hípico de Santiago (13:30)...
⏳ [RACE-CHECK] Carrera 1 aún no está completa, re-verificando en 1 min...

🏁 [RACE-CHECK] Verificando carrera 1 - Club Hípico de Santiago (13:30)...
✅ [RACE-CHECK] Carrera 1 cerrada! Importando resultados...
✨ [RACE-CHECK] Carrera 1 importada: 1°=5, Fav=3
```

## Configuración

Edita `server.js`:

**Hora de importación de programas (línea ~42):**
```javascript
const SCHEDULE_HOUR = 7; // 7:00 AM
```

**Configuración de verificación de carreras (línea ~204-206):**
```javascript
const CHECK_BEFORE_POST_TIME_MINUTES = 2; // Empezar 2 min después del postTime
const RECHECK_INTERVAL_MS = 60000; // Verificar cada 1 minuto (60000 ms)
const MAX_RETRIES = 30; // Máximo 30 intentos (30 min)
```

**Ventana de operación (línea ~218):**
```javascript
// Solo verificar entre las 12 PM y 11 PM
if (currentHour < 12 || currentHour >= 23) {
  return;
}
```

## Requisitos

- ✅ El servidor debe estar corriendo (`npm start`)
- ✅ Conexión a internet (para Teletrak)
- ✅ Al menos una campaña activa para la fecha del día
- ✅ Programa importado (automático a las 7 AM o manual)

## Notas importantes

- **Cada carrera se verifica independientemente** basada en su propio postTime
- **No se desperdician consultas** verificando carreras que aún no están cerca
- **El favorito viene del mercado de apuestas real** de Teletrak, no se inventa
- **Los resultados se replican a todas las jornadas activas** (diaria, semanal, mensual)
- **Si una carrera falla en importar, se re-intenta automáticamente** cada minuto
- **Una carrera importada no se vuelve a verificar** (usa Set para trackear)
