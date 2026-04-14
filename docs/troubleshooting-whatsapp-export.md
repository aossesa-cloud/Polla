# 🔧 Troubleshooting - Imagen en Blanco/Negro

## Problema Reportado
La imagen generada aparece completamente negra o en blanco sin contenido visible.

## Causas Comunes

### 1. **Elemento posicionado fuera de pantalla**
**Causa:** `position: fixed; left: -10000px` hace que el navegador no renderice el contenido.

**Solución aplicada:**
- Cambiado a `position: absolute; left: 0; top: 0`
- Agregado `visibility: hidden; opacity: 0` para ocultar sin afectar renderizado
- Agregado `z-index: -1` para mantener detrás del contenido visible

### 2. **Fuentes no cargadas**
**Causa:** html-to-image captura antes de que las fuentes web estén listas.

**Solución aplicada:**
- Agregado `await document.fonts.ready` antes de capturar
- Agregado delay de 100ms para asegurar renderizado completo

### 3. **Reflow no forzado**
**Causa:** El navegador no ha calculado el layout del elemento.

**Solución aplicada:**
- Agregado `node.offsetHeight` para forzar reflow antes de capturar

## Cómo Verificar que Funciona

### Paso 1: Abrir Demo
```bash
# Abrir archivo directamente
start public\exports\demo-whatsapp.html

# O desde la terminal
start "" "d:\56974\Documents\Tablas\Nuevas\public\exports\demo-whatsapp.html"
```

### Paso 2: Abrir Consola del Navegador
Presiona **F12** o **Ctrl+Shift+I** y ve a la pestaña "Console"

### Paso 3: Buscar Mensajes de Log
Deberías ver algo así:
```
🚀 Iniciando generación de imagen...
📊 Datos a exportar: {studs: 40, races: 15, totalPicks: 600}
📱 Generando imagen WhatsApp... {title: "...", date: "...", track: "...", races: 15, studs: 40}
✅ Imagen generada exitosamente: {size: "342.56 KB", type: "image/png"}
✅ Imagen generada: 342.56 KB
```

### Paso 4: Verificar la Imagen
- Debe aparecer una vista previa con datos
- Debe tener header verde con título
- Debe mostrar tabla con participantes y carreras
- Tamaño típico: 200-500 KB

## Si Sigue Fallando

### Verificación 1: ¿html-to-image está cargado?
En la consola escribe:
```javascript
window.htmlToImage
```
Debe devolver un objeto, no `undefined`.

**Si es undefined:**
- Recarga la página con Ctrl+F5
- Verifica que el script CDN esté en el HTML

### Verificación 2: ¿Hay datos?
En la consola, busca el mensaje "📊 Datos a exportar"
- `studs` debe ser > 0
- `races` debe ser > 0
- `totalPicks` debe ser > 0

**Si son 0:**
- El problema es la extracción de datos, no la generación de imagen
- Revisa que el evento tenga participantes cargados

### Verificación 3: Error específico
Busca mensajes de error en rojo en la consola:

| Error | Causa | Solución |
|-------|-------|----------|
| "html-to-image no esta disponible" | Script CDN no cargó | Recarga página, verifica conexión |
| "No se pudo generar la imagen" | html-to-image falló | Revisa consola para más detalles |
| "No se encontro el evento" | Event ID incorrecto | Verifica que haya datos cargados |

### Verificación 4: Probar en navegador diferente
- Chrome/Edge: ✅ Mejor soporte
- Firefox: ✅ Funciona bien
- Safari: ⚠️ Puede tener problemas con Web Share API

## Debugging Avanzado

### Inspeccionar el nodo generado
Agrega este código temporal en la consola:

```javascript
// Generar datos de prueba
const testData = {
  title: 'Test',
  date: '2026-04-10',
  track: 'Hipódromo',
  races: [{raceNumber: 1}],
  studs: [{name: 'Test Stud', picks: [{raceNumber: 1, pick: '5'}]}]
};

// Crear exportador
const exporter = new window.WhatsAppPicksExporter();
const node = exporter.buildExportNode(testData);

// Agregar al body temporalmente (visible para debug)
node.style.visibility = 'visible';
node.style.opacity = '1';
node.style.zIndex = '9999';
document.body.appendChild(node);

console.log('Nodo generado:', node);
console.log('HTML del nodo:', node.innerHTML.substring(0, 500));
```

Esto mostrará el nodo en pantalla para que veas si se está construyendo correctamente.

### Probar captura manual
```javascript
// Después de ejecutar el código anterior
const node = document.querySelector('[style*="position: absolute"]');
window.htmlToImage.toBlob(node, {pixelRatio: 2}).then(blob => {
  const url = URL.createObjectURL(blob);
  console.log('Blob size:', (blob.size / 1024).toFixed(2), 'KB');
  window.open(url, '_blank');
});
```

## Solución Temporal Alternativa

Si html-to-image sigue fallando, puedes usar html2canvas como alternativa:

1. Agrega al HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

2. Cambia en whatsapp-pronosticos.js:
```javascript
// En lugar de:
const blob = await window.htmlToImage.toBlob(node, {...});

// Usa:
const canvas = await html2canvas(node, {
  scale: 2,
  backgroundColor: this.colors.background
});
const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
```

## Checklist de Verificación

- [ ] Abrí la consola del navegador (F12)
- [ ] Veo mensajes de log con emojis 📱  ✅
- [ ] `studs` y `races` son > 0
- [ ] No hay errores en rojo en la consola
- [ ] La imagen aparece con contenido visible
- [ ] La imagen tiene header verde
- [ ] Se ven los nombres de participantes
- [ ] Se ven los números de carreras
- [ ] El tamaño es razonable (200-500 KB)

## Archivos Modificados

Los siguientes archivos fueron actualizados para fixear este problema:

1. **`public/exports/whatsapp-pronosticos.js`**
   - Cambiada estrategia de posicionamiento
   - Agregado espera de fuentes
   - Agregado forzado de reflow
   - Agregado logging de debug

2. **`public/exports/demo-whatsapp.html`**
   - Mejor manejo de errores
   - Logging mejorado
   - Mensajes más descriptivos

## Cómo Probar la Solución

1. **Limpiar cache del navegador:**
   - Ctrl+Shift+Delete
   - Seleccionar "Cached images and files"
   - Limpiar

2. **Recargar página:**
   - Ctrl+F5 (hard reload)

3. **Probar demo:**
   ```bash
   start public\exports\demo-whatsapp.html
   ```

4. **Verificar en consola:**
   - Debes ver logs con emojis
   - Debes ver "✅ Imagen generada exitosamente"
   - Debes ver la imagen con contenido

## ¿Sigue el problema?

Si después de todo esto la imagen sigue en blanco:

1. **Revisa la versión del navegador:**
   ```javascript
   navigator.userAgent
   ```

2. **Prueba en modo incógnito:**
   - Ctrl+Shift+N (Chrome)
   - Ctrl+Shift+P (Firefox)

3. **Captura screenshot de la consola** y envíalo para debuggear más

4. **Prueba la alternativa con html2canvas** (ver arriba)

---

**Última actualización:** 2026-04-10  
**Estado del fix:** ✅ Aplicado
