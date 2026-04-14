# 🚀 Inicio Rápido - Exportación WhatsApp

##  🆕 Automatización Inteligente (100% Automático)

El sistema ahora es **inteligente y 100% automático**:

### ✅ Lo que hace automáticamente:

| Hora | Acción | Beneficio |
|------|--------|-----------|
| **7:00 AM** | Importa programas con **postTime** | Sabemos a qué hora es cada carrera |
| **postTime + 2 min** | Verifica si la carrera cerró | **Preciso**: va cuando realmente necesita |
| **Cada 1 min** | Re-verifica hasta que cierre | **No pierde ninguna carrera** |
| **Al cerrar** | Importa resultados + **FAVORITO** | **Favorito automático** del mercado real |

### 🎯 EL FAVORITO - 100% Automático

**Antes:**
1. Veías que cerró una carrera
2. Ibas a otro lado a buscar el favorito
3. Lo cargabas manualmente

**Ahora (Sistema Inteligente):**
1. **7:00 AM**: Se importa el programa con el postTime de cada carrera
2. El sistema programa verificaciones para cada carrera individualmente
3. **postTime + 2 min**: Empieza a verificar si la carrera cerró
4. Si no cerró, re-verifica cada minuto
5. **Cuando cierra**: Importa automáticamente resultados + **favorito del mercado de apuestas real**
6. Guarda todo en tu jornada activa

**Ejemplo real:**
```
Carrera 1 programada a las 13:30

13:32 → ⏳ Carrera 1 aún no está completa...
13:33 → ⏳ Carrera 1 aún no está completa...
13:34 → ✅ Carrera 1 cerrada! Importando...
        ✨ Carrera 1 importada: 1°=5, Fav=3 (favorito automático!)
```

### 📊 Logs en consola

**7:00 AM - Importa programas:**
```
⏰ [AUTO-IMPORT] Iniciando importación automática de programas
✅ [AUTO-IMPORT] chs: 15 carreras importadas
```

**Después - Programa verificaciones:**
```
📅 [SCHEDULE] Programando verificación de 15 carreras para Club Hípico...
⏰ [SCHEDULE] Carrera 1: programada a las 13:30, verificación a las 13:32:00
⏰ [SCHEDULE] Carrera 2: programada a las 14:00, verificación a las 14:02:00
```

**Durante las carreras - Verifica y importa:**
```
🏁 [RACE-CHECK] Verificando carrera 1 - Club Hípico (13:30)...
⏳ Carrera 1 aún no está completa, re-verificando en 1 min...

✅ [RACE-CHECK] Carrera 1 cerrada! Importando resultados...
✨ Carrera 1 importada: 1°=5, Fav=3
```

### ⚙️ Configurar horarios

Edita `server.js`:

**Programas (línea ~42):**
```javascript
const SCHEDULE_HOUR = 7; // Hora de importación de programas
```

**Verificación de carreras (línea ~204-206):**
```javascript
const CHECK_BEFORE_POST_TIME_MINUTES = 2; // Cuándo empezar a verificar
const RECHECK_INTERVAL_MS = 60000; // Cada cuánto re-verificar (60000 = 1 min)
```

### 📖 Documentación completa

Ver `docs/auto-import-setup.md` para más detalles.

---

## Prueba Inmediata (2 minutos)

### Opción 1: Demo Independiente (Recomendado para probar)

1. **Abrir el demo directamente:**
   ```
   d:\56974\Documents\Tablas\Nuevas\public\exports\demo-whatsapp.html
   ```
   
   Doble clic en el archivo o:
   ```bash
   start public\exports\demo-whatsapp.html
   ```

2. **Verás:**
   - Imagen generada automáticamente con 40 participantes × 15 carreras
   - Botón "Descargar PNG" para guardar la imagen
   - Vista previa en tiempo real

3. **Haz clic en "Descargar PNG"**
   - Se descargará un archivo PNG
   - Ábrelo y verifica que se vea bien
   - ¡Listo!

---

### Opción 2: App Completa (Requiere servidor corriendo)

1. **Verificar que el servidor esté corriendo:**
   ```bash
   netstat -ano | findstr ":3030"
   ```
   
   Si NO ves nada, inicia el servidor:
   ```bash
   node server.js
   ```

2. **Abrir la app:**
   ```
   http://localhost:3030
   ```

3. **Navegar a cualquier vista:**
   - Diaria
   - Semanal  
   - Mensual

4. **Buscar una tabla de "Pronósticos registrados"**
   - Debe tener participantes cargados
   - Si no hay, primero carga algunos pronósticos

5. **Haz clic en el botón 📱 WhatsApp**
   - Está al lado de "Compartir imagen" y "Copiar imagen"
   - Se generará la imagen automáticamente

6. **Resultado:**
   - **En móvil**: Se abre menú de compartir → Elige WhatsApp
   - **En desktop**: Se descarga el archivo PNG

---

## Verificación Rápida

### ✅ Señales de que funciona:
- [ ] Ves el botón 📱 WhatsApp en las tablas
- [ ] Al hacer clic, aparece "Generando imagen..." brevemente
- [ ] Se descarga un archivo o se abre menú de compartir
- [ ] El archivo PNG tiene ~200-500 KB
- [ ] Al abrir el PNG, ves TODAS las carreras y participantes

### ❌ Si algo falla:

| Problema | Causa Probable | Solución |
|----------|----------------|----------|
| No aparece el botón 📱 | App no recargada | Refresca el navegador (Ctrl+F5) |
| "No se encontró el evento" | No hay participantes | Carga pronósticos primero |
| "No se pudo generar" | html-to-image no cargó | Revisa la consola del navegador |
| Imagen en blanco | Error de CORS | Abre desde el servidor, no archivo |

---

## Archivos Clave para Probar

```
✅ Demo independiente:
   public/exports/demo-whatsapp.html

✅ App completa:
   http://localhost:3030

✅ Documentación:
   docs/whatsapp-export-guide.md
   public/exports/README.md
```

---

## Ejemplo de lo que Verás

### En la Tabla de Pronósticos:
```
┌──────────────────────────────────────────┐
│ Pronósticos registrados                  │
│ Detalle por carrera...                   │
│                                          │
│ [Compartir imagen] [Copiar imagen]       │
│ [📱 WhatsApp] ← ¡NUEVO BOTÓN!            │
└──────────────────────────────────────────┘
```

### Imagen Generada (aproximada):
```
┌──────────────────────────────────────┐
│   POLLA DIARIA - GRUPO ELITE         │
│   📅 2026-04-10  🏇 Hipódromo Chile  │
├──────────────────────────────────────┤
│ PARTICIPANTE  │ C1│ C2│ C3│ ... C15  │
├───────────────┼───┼───┼───┼──────────┤
│ Stud El Rayo  │ 5 │ 3 │ 8 │ ...  2   │
│ Stud Thunder  │ 2 │ 7 │ 1 │ ...  9   │
│ Stud Patrona  │ 9 │ ✗ │ 4 │ ...  6   │
│ ... (40 en total)                     │
├──────────────────────────────────────┤
│   40 participantes · 15 carreras     │
└──────────────────────────────────────┘
```

---

## ¿Necesitas Ayuda?

1. **Revisa la consola del navegador** (F12)
   - Busca mensajes de error en rojo
   - Debería decir "✅ Imagen generada exitosamente"

2. **Verifica los archivos:**
   ```bash
   dir public\exports
   ```
   Deben aparecer:
   - whatsapp-pronosticos.js
   - demo-whatsapp.html
   - README.md

3. **Prueba el demo primero**
   - Es más fácil de depurar
   - No requiere servidor
   - Tiene datos de ejemplo incluidos

---

## Siguiente Paso: Uso Real

Una vez que pruebes el demo:

1. **Carga datos reales en la app**
   - Ve a Administrador > Pronóstico
   - Carga algunos pronósticos

2. **Prueba con la app real**
   - Ve a la vista correspondiente
   - Haz clic en 📱 WhatsApp
   - Comparte a un grupo de prueba

3. **Ajusta si es necesario**
   - Puedes cambiar colores en el constructor
   - Puedes ajustar tamaños de fuente
   - Puedes modificar el diseño en whatsapp-pronosticos.js

---

**¿Todo funciona?** ¡Perfecto! 🎉

**¿Algo falla?** Revisa la consola y el archivo de troubleshooting en:
`docs/whatsapp-export-guide.md` → Sección "Solución de Problemas"
