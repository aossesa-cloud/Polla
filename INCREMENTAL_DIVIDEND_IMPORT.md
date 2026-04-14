# 🎯 Carga Incremental de Dividendos

## Problema Resuelto

**Antes**: Cada vez que se ejecutaba la carga automática de dividendos:
- ❌ Se sobrescribían TODAS las carreras
- ❌ Se perdían ediciones manuales
- ❌ Se perdían datos importantes (favoritos, ajustes)

**Ahora**: La carga es **INCREMENTAL** e **INTELIGENTE**:
- ✅ NO sobrescribe carreras completas
- ✅ Hace MERGE de datos (rellena huecos)
- ✅ Preserva ediciones manuales
- ✅ Solo carga carreras incompletas o nuevas

---

## Lógica de Negocio

### Definición de "Carrera Completa"

Una carrera se considera **completa** si tiene:
- ✅ `primero` (primer lugar)
- ✅ `segundo` (segundo lugar)
- ✅ `tercero` (tercer lugar)
- ✅ `ganador` (dividendo del ganador)

```javascript
function isRaceComplete(result) {
  return result.primero && result.segundo && result.tercero && 
         (result.ganador || result.divSegundo || result.divTercero);
}
```

### Estrategia de Merge

**Modo: `preferExisting = true`** (default)

```javascript
// Si el campo YA existe en existing → MANTENER
// Si el campo NO existe → COPIAR de newData
const merged = {
  ...existing,               // Primero todo lo existente
  ...fillGapsOnly(newData)   // Luego solo huecos de newData
}
```

**Ejemplo:**

| Campo | Existing | New Data | Resultado |
|-------|----------|----------|-----------|
| `primero` | "15" | "15" | "15" (existing) |
| `ganador` | "1.20" | "1.20" | "1.20" (existing) |
| `favorito` | "" | "15" | "15" (new) |
| `divSegundo` | "" | "1.80" | "1.80" (new) |

---

## Implementación

### Nuevas Funciones en `storage.js`

1. **`upsertResultIncremental(eventId, race, newData, options)`**
   - Upsert inteligente con merge
   - Opciones:
     - `skipIfComplete: true` → Saltar si carrera completa
     - `preferExisting: true` → Priorizar datos existentes

2. **`isRaceComplete(result)`**
   - Valida si una carrera tiene todos los dividendos necesarios

3. **`mergeResultsSmart(existing, newData)`**
   - Merge que prefiere existentes, solo rellena huecos

4. **`mergeResultsNewFirst(existing, newData)`**
   - Alternativa: prefiere nuevos, mantiene existentes si faltan

### Cambios en `server.js`

**Antes:**
```javascript
upsertResult(genericEventId, raceResult.race, raceResult);
```

**Ahora:**
```javascript
const importResult = upsertResultIncremental(genericEventId, raceResult.race, raceResult, {
  skipIfComplete: true,
  preferExisting: true
});

if (importResult.skipped) {
  console.log(`⏭️ Carrera saltada: ${importResult.reason}`);
} else {
  console.log(`✅ Carrera guardada/actualizada`);
}
```

---

## Logs de Diagnóstico

### Cuando la carrera YA existe:
```
ℹ️ [EXISTENTE] Carrera 1 ya tiene datos:
   1°=15, 2°=1, 3°=9
   Divs: Ganador=1.20, 2°=1.80, 3°=1.80
   Favorito=15
🔄 Se hará MERGE inteligente (NO se sobrescribe)
```

### Cuando es NUEVA:
```
🆕 [NUEVA] Carrera 5 no tiene datos, se guardará completo
```

### Después del merge:
```
✅ [INCREMENTAL] Carrera 5 actualizada:
   existingFields: 12
   newFields: 15
   mergedFields: 15
   wasUpdated: true
```

### Si está completa:
```
⏭️ [INCREMENTAL] Carrera 3 ya está completa, saltando...
⏭️ [AUTO-IMPORT] Carrera 3 saltada: already_complete
```

---

## Ejemplo de Uso

### Escenario 1: Carrera incompleta → se rellena

**Estado actual:**
```json
{
  "primero": "15",
  "segundo": "1",
  "tercero": "9",
  "ganador": "1.20",
  "divSegundo": "1.80",
  "divTercero": "1.80",
  "favorito": ""  // ❌ FALTANTE
}
```

**Nuevo dato de Teletrak:**
```json
{
  "favorito": "15",  // ✅ AHORA SÍ
  "ganador": "1.20"  // Ya existe → NO tocar
}
```

**Resultado:**
```json
{
  "primero": "15",
  "segundo": "1",
  "tercero": "9",
  "ganador": "1.20",       // ✅ Mantenido
  "divSegundo": "1.80",    // ✅ Mantenido
  "divTercero": "1.80",    // ✅ Mantenido
  "favorito": "15"         // ✅ Rellenado
}
```

### Escenario 2: Carrera completa → se salta

**Estado actual:**
```json
{
  "primero": "15",
  "segundo": "1",
  "tercero": "9",
  "ganador": "1.20",
  "divSegundo": "1.80",
  "divTercero": "1.80",
  "favorito": "15"
}
```

**Acción:** ⏭️ **SALTADA** - `already_complete`

---

## Beneficios

1. ✅ **No se pierden ediciones manuales**
2. ✅ **Solo se cargan datos faltantes**
3. ✅ **Logs claros de qué está pasando**
4. ✅ **Idempotente** (puede ejecutarse N veces sin daño)
5. ✅ **Performance** (no escribe si no es necesario)

---

## Testing

Para probar que funciona correctamente:

1. **Edita manualmente** una carrera en el admin (ej: cambia `favorito`)
2. **Ejecuta la carga automática** (espera a que Teletrak actualice)
3. **Verifica en los logs:**
   ```
   ℹ️ [EXISTENTE] Carrera X ya tiene datos
   🔄 Se hará MERGE inteligente
   ⏭️ [INCREMENTAL] Carrera X saltada: already_complete
   ```
4. **Verifica en la BD:** Tu edición manual sigue ahí ✅

---

## Rollback (si algo falla)

Si necesitas volver al comportamiento anterior (destructivo), cambia en `server.js`:

```javascript
// Cambiar esto:
const importResult = upsertResultIncremental(genericEventId, raceResult.race, raceResult, {
  skipIfComplete: true,
  preferExisting: true
});

// Por esto:
upsertResult(genericEventId, raceResult.race, raceResult);
```

---

**Fecha de implementación:** 2026-04-13  
**Archivos modificados:**
- `storage.js` (nuevas funciones)
- `server.js` (uso de funciones incrementales)
