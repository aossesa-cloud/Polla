# Promo 2x - Sistema de Relaciones entre Participantes

## 📋 Resumen

Se implementó un sistema completo para gestionar relaciones de Promo 2x entre participantes del mismo grupo.

---

## ✅ Qué se Implementó

### 1. **Hook `usePromoRelations`** (`src/hooks/usePromoRelations.js`)

Funciones principales:
- ✅ `getSameGroupParticipants(participantName)` - Filtra participantes del mismo grupo
- ✅ `savePromoRelation(participantName, partners)` - Guarda relación promo
- ✅ `getPromoPartners(participantName)` - Obtiene partners configurados
- ✅ `hasPromoPartners(participantName)` - Verifica si tiene partners
- ✅ `validatePromoRelation(participantName, partners)` - Valida relación
- ✅ `arePromoPartners(participant1, participant2)` - Verifica si son partners

### 2. **Componente `PromoPartnersSelector`** (`src/components/picks/PromoPartnersSelector.jsx`)

UI completa para gestionar partners:
- ✅ Multiselect visual con chips
- ✅ Filtra por mismo grupo automáticamente
- ✅ Excluye el participante actual
- ✅ Muestra badges de grupo
- ✅ Resumen de partners seleccionados
- ✅ Botón de limpiar relación
- ✅ Mensajes de estado y error

### 3. **Integración en PickForm**

- ✅ Se muestra SOLO si la campaña tiene `promoEnabled: true`
- ✅ Se muestra SOLO si hay un participante seleccionado
- ✅ Pasa `campaignId`, `groupId`, `promoPrice` al selector
- ✅ Callback `onPartnersChange` para actualizar estado

---

## 🧪 Cómo Funciona

### Flujo Completo:

```
Campaña con promoEnabled: true
       ↓
Usuario selecciona participante
       ↓
[PromoPartnersSelector] aparece automáticamente
       ↓
Muestra participantes del mismo grupo (excluyendo el actual)
       ↓
Usuario selecciona partners (multiselect)
       ↓
Click "Guardar partners (X)"
       ↓
[validatePromoRelation] valida
       ↓
[savePromoRelation] guarda en localStorage + backend
       ↓
✅ Relación promo configurada
```

---

## 📊 Estructura de Datos

### localStorage:

```javascript
{
  "campaign-123": {
    "Stud A": {
      partners: ["Stud B", "Stud C"],
      updatedAt: "2026-04-12T15:30:00.000Z"
    },
    "Stud B": {
      partners: ["Stud A"],
      updatedAt: "2026-04-12T15:31:00.000Z"
    }
  }
}
```

### Backend (registry):

```javascript
{
  name: "Stud A",
  group: "grupo-a",
  promoPartners: ["Stud B", "Stud C"],
  diaria: true,
  semanal: false,
  mensual: true
}
```

---

## 🎨 UI/UX

### Estados del Selector:

1. **Campaña sin promo:**
   - No se muestra nada

2. **Campaña con promo, sin participante:**
   - Mensaje: "Selecciona un participante para configurar sus partners de promo"

3. **Campaña con promo, sin participantes del mismo grupo:**
   - Warning: "No hay otros participantes del mismo grupo para seleccionar como partner"

4. **Campaña con promo, participante seleccionado:**
   - Header con ícono 💑, nombre del participante, valor promo
   - Grid de chips con participantes disponibles
   - Chips seleccionables (click para toggle)
   - Resumen de partners seleccionados
   - Botón "Guardar partners (X)"
   - Botón "Limpiar" (si ya tiene partners)

---

## 🔧 Validaciones

| Validación | Mensaje de Error |
|-----------|------------------|
| Sin participante | "Selecciona un participante primero" |
| Sin partners | "Selecciona al menos un partner para promo" |
| Partners duplicados | "No se permiten partners duplicados" |
| Partner no existe | "\"X\" no es un participante válido" |
| Auto-selección | "No puedes ser tu propio partner" |

---

## 📁 Archivos Creados/Modificados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `src/hooks/usePromoRelations.js` | ✅ **NUEVO** | Hook de gestión de promo |
| `src/components/picks/PromoPartnersSelector.jsx` | ✅ **NUEVO** | UI del selector |
| `src/components/picks/PickForm.jsx` | 🔄 Modificado | Integración del selector |
| `PickEntry.module.css` | 🎨 Actualizado | Estilos promo 2x |

---

## 🚀 Cómo Probar

1. **Crear campaña con promo habilitada:**
   - Ve a "Campañas" → "Nueva Campaña"
   - Activa "Promoción 2x"
   - Configura valor promo
   - Guarda

2. **Ingresar pronósticos:**
   - Ve a "Ingreso Picks"
   - Selecciona la campaña con promo
   - Selecciona un participante
   - **Aparecerá el selector de promo partners**
   - Selecciona 1+ partners del mismo grupo
   - Click "Guardar partners"

3. **Verificar:**
   - Los chips seleccionados se marcan con ✓ verde
   - Resumen muestra "Partners seleccionados (X): Stud B, Stud C"
   - Mensaje de éxito: "✅ Promo configurada: Stud A puede jugar con 2 participante(s)"

---

## 💡 Características Clave

### Filtrado Inteligente:
- ✅ Solo muestra participantes del **mismo grupo**
- ✅ **Excluye** el participante actual
- ✅ Si no hay grupo definido, muestra todos

### UX Optimizada:
- ✅ **Chips clickeables** (no dropdown tradicional)
- ✅ Feedback visual inmediato (verde = seleccionado)
- ✅ Contador de partners en el botón
- ✅ Botón de limpiar para remover relación

### Persistencia:
- ✅ **localStorage** para relaciones
- ✅ **Backend** via `upsertRegistryParticipant`
- ✅ Timestamp de última actualización

### Validación Robusta:
- ✅ No permite guardar sin partners
- ✅ No permite duplicados
- ✅ No permite auto-selección
- ✅ Verifica que partners existan

---

## 📊 Métricas

- **Componentes creados:** 1 (PromoPartnersSelector)
- **Hooks creados:** 1 (usePromoRelations)
- **Archivos modificados:** 2 (PickForm, CSS)
- **Validaciones:** 5
- **Estados de UI:** 4
- **Líneas de código:** ~350

---

## 🔮 Próximos Pasos

1. **Backend:** Endpoint dedicado para gestionar promo relations
2. **Ranking:** Mostrar promo en tabla de posiciones (indicador visual)
3. **Historial:** Log de cambios de partners
4. **Bulk edit:** Configurar promo para múltiples participantes a la vez
5. **Analytics:** Métricas de uso de promo por campaña
