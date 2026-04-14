# Campaign Creation Logging & Validation

## Cambios Realizados

### Problema Original
- Las campañas no se estaban creando correctamente
- No había logs para diagnosticar por qué fallaba la creación
- No había validación de datos en el backend
- Errores silenciosos sin feedback al usuario

### Solución Implementada

#### 1. Nuevo Endpoint Dedicado: `POST /api/admin/campaigns`

**Archivo:** `server.js` (líneas ~1545-1700)

Este endpoint permite crear campañas con validación completa y logging detallado.

**Payload requerido:**
```json
{
  "kind": "daily|weekly|monthly",
  "campaign": {
    "name": "Nombre de la campaña",
    // campos específicos por tipo (ver abajo)
  }
}
```

**Validaciones implementadas:**

| Validación | Tipo | Mensaje de Error |
|-----------|------|------------------|
| Missing kind/campaign | 400 | "Faltan datos requeridos" |
| Invalid kind | 400 | "Tipo de campaña inválido" |
| Missing name | 400 | "Nombre de campaña requerido" |
| Daily without date | 400 | "Fecha requerida para campañas diarias" |
| Weekly without activeDays | 400 | "Días activos requeridos para campañas semanales" |
| Duplicate ID | 409 | "Campaña duplicada" |
| Server error | 500 | Error detallado con stack trace |

**Estructura de campaña creada:**
```javascript
{
  id: "daily-1776008006098",           // Auto-generado o proporcionado
  name: "Mi Campaña",                   // Requerido
  enabled: true,                        // true por defecto
  groupId: "",                          // Optional
  raceCount: 12,                        // Default: 12
  entryValue: 5000,                     // Default: 0
  promoEnabled: true,
  promoPrice: 9000,
  scoring: {
    mode: "dividend",
    doubleLastRace: false,
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 }
  },
  // Campos específicos por tipo:
  date: "2026-04-12",                   // daily
  activeDays: ["Lunes", ...],           // weekly
  finalDays: ["Sabado"],                // weekly
  format: "individual",                 // weekly/monthly
  groupSize: 4,                         // weekly
  qualifiersPerGroup: 2,                // weekly
  hipodromos: ["Club Hipico"],          // monthly
  startDate: "",                        // monthly
  endDate: "",                          // monthly
  
  // Metadata
  competitionMode: "individual",
  eventIds: [],
  eventId: null,
  registeredParticipants: [],
  createdAt: "2026-04-12T15:30:00.000Z",
  lastModified: "2026-04-12T15:30:00.000Z"
}
```

#### 2. Logging Detallado

**Tags de log utilizados:**
- `📝 [CAMPAIGN-CREATE]` - Creación de campañas
- `🔄 [CAMPAIGN-UPDATE]` - Actualización de campañas
- `🗑️ [CAMPAIGN-DELETE]` - Eliminación de campañas
- `⚙️ [SETTINGS]` - Actualización de configuración general

**Ejemplo de logs de creación exitosa:**
```
📝 [CAMPAIGN-CREATE] Solicitud de creación recibida a las 2026-04-12T15:30:00.000Z
[CAMPAIGN-CREATE] Body recibido: {
  "kind": "daily",
  "campaign": {
    "name": "Test Daily",
    "date": "2026-04-12"
  }
}
[CAMPAIGN-CREATE] ID generado: daily-1776008006098
[CAMPAIGN-CREATE] Campaña normalizada: {...}
[CAMPAIGN-CREATE] Campañas actuales en daily: 4
[CAMPAIGN-CREATE] Todas las campañas: {...}
✅ [CAMPAIGN-CREATE] Campaña 'Test Daily' (daily-1776008006098) creada exitosamente
[CAMPAIGN-CREATE] Guardado en data/overrides.json
```

**Ejemplo de log de error:**
```
❌ [CAMPAIGN-CREATE] Error: Campaña diaria sin fecha
[CAMPAIGN-CREATE] Campaña: {
  "name": "Test Daily",
  "raceCount": 12
}
```

#### 3. Funciones Modificadas en `storage.js`

**`updateCampaign()`** (líneas ~518-545)
- Agregado logging detallado antes/después de actualización
- Valida que la campaña exista antes de actualizar
- Lanza error explícito si no encuentra la campaña
- Agrega timestamp `lastModified`

**`deleteCampaign()`** (líneas ~547-573)
- Logging de campaña encontrada/eliminada
- Logging de eventos que se están limpiando
- Validación explícita de existencia
- Timestamp en operaciones

**`saveExports`** agregado al module.exports

#### 4. Test Script

**Archivo:** `testCampaignCreation.js`

Script completo que prueba:
1. ✅ Validación de campos faltantes (400)
2. ✅ Validación de kind inválido (400)
3. ✅ Validación de nombre faltante (400)
4. ✅ Validación de fecha faltante en daily (400)
5. ✅ Creación exitosa de daily campaign (201)
6. ✅ Creación exitosa de weekly campaign (201)
7. ✅ Rechazo de ID duplicado (409)

**Uso:**
```bash
node testCampaignCreation.js
```

## Cómo Usar el Nuevo Endpoint

### Frontend Integration

**Opción 1: Usar el nuevo endpoint dedicado (RECOMENDADO)**
```javascript
// Crear campaña diaria
const response = await fetch('/api/admin/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    kind: 'daily',
    campaign: {
      name: 'Carrera 12 Abril',
      date: '2026-04-12',
      raceCount: 16,
      entryValue: 5000,
      promoEnabled: true,
      promoPrice: 9000
    }
  })
});

const data = await response.json();
if (response.ok) {
  console.log('✅ Campaña creada:', data.campaign);
} else {
  console.error('❌ Error:', data.error, data.detail);
}
```

**Opción 2: Usar el endpoint genérico de settings (EXISTENTE)**
```javascript
// Actualizar todas las campañas de una vez
await fetch('/api/admin/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaigns: {
      daily: [...existingDaily, newDaily],
      weekly: [...existingWeekly],
      monthly: [...existingMonthly]
    }
  })
});
```

### Cuándo Usar Cada Endpoint

| Endpoint | Cuándo Usar | Ventajas |
|----------|-------------|----------|
| `POST /api/admin/campaigns` | Crear una nueva campaña | Validación automática, logs detallados, manejo de errores |
| `POST /api/admin/settings` | Actualizar múltiples configuraciones a la vez | Bulk update, más eficiente |
| `POST /api/admin/campaigns/:kind/:id/action` | Activar/desactivar/eliminar | Operaciones en campañas existentes |

## Diagnóstico de Problemas

### Revisar Logs del Servidor

Los logs aparecerán en la consola donde corre `node server.js`:

```bash
# Ver logs en tiempo real
node server.js

# O si usas PM2
pm2 logs tablas-nuevas
```

### Logs a Buscar

**Si la campaña NO se crea:**
```
❌ [CAMPAIGN-CREATE] Error: <motivo específico>
```
→ Revisar el mensaje de error para saber qué campo falta o es inválido

**Si la campaña SÍ se crea:**
```
✅ [CAMPAIGN-CREATE] Campaña '<name>' (<id>) creada exitosamente
```
→ Verificar en `data/overrides.json` que exista la campaña

### Verificar en overrides.json

```bash
# Ver campañas actuales
node -e "const d=require('./data/overrides.json'); console.log(JSON.stringify(d.settings.campaigns, null, 2))"
```

## Troubleshooting

### Error: "Faltan datos requeridos"
**Causa:** El body no tiene `kind` o `campaign`
**Solución:** Enviar ambos campos en el request

### Error: "Fecha requerida para campañas diarias"
**Causa:** Campaña daily sin campo `date`
**Solución:** Agregar `date: "YYYY-MM-DD"` al campaign object

### Error: "Días activos requeridos para campañas semanales"
**Causa:** Campaña weekly sin `activeDays` o array vacío
**Solución:** Agregar `activeDays: ["Lunes", "Martes", ...]` con al menos un día

### Error: "Campaña duplicada"
**Causa:** Ya existe una campaña con ese ID
**Solución:** No enviar `id` en el campaign object (dejar que se auto-genere) o usar un ID único

### Error 500: "Error interno"
**Causa:** Error inesperado en el servidor
**Solución:** Revisar el stack trace en los logs del servidor

## Beneficios de Esta Implementación

1. ✅ **Visibilidad completa**: Cada operación de campaña genera logs detallados
2. ✅ **Validación temprana**: Errores se detectan antes de guardar
3. ✅ **Mensajes claros**: Errores descriptivos en español
4. ✅ **HTTP status correctos**: 400 (bad request), 409 (conflict), 500 (server error), 201 (created)
5. ✅ **Testing automatizado**: Script para validar todos los paths
6. ✅ **No breaking changes**: Endpoints existentes siguen funcionando igual
7. ✅ **IDs auto-generados**: No necesidad de gestionar IDs manualmente
8. ✅ **Timestamps**: Cada campaña tiene `createdAt` y `lastModified`

## Próximos Pasos Recomendados

1. **Actualizar el frontend** para usar el nuevo endpoint `POST /api/admin/campaigns`
2. **Agregar UI de error handling** para mostrar mensajes de error al usuario
3. **Agregar confirmación visual** cuando se crea una campaña exitosamente
4. **Considerar agregar** un endpoint `GET /api/admin/campaigns` para listar campañas
5. **Agregar validación** de que `date` sea un formato YYYY-MM-DD válido
