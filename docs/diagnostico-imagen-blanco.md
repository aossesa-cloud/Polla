# 🔍 Diagnóstico Paso a Paso - Imagen en Blanco

## El Problema
La imagen se genera completamente oscura/negra sin contenido visible.

## Diagnóstico Rápido

### PASO 1: Verificar que html-to-image funciona

```bash
# Abrir este archivo:
start public\exports\test-simple.html
```

**Qué esperar:**
- Una página simple con un botón "Generar Imagen"
- Al hacer clic, debe aparecer una imagen con header verde y contenido
- Si esto NO funciona, el problema es html-to-image, no nuestro código

### PASO 2: Si el test simple FUNCIONA

Entonces el problema está en cómo estamos construyendo el nodo. Sigue al PASO 3.

### PASO 3: Si el test simple NO FUNCIONA

El problema es con html-to-image o el navegador. Intenta:
1. Usar Chrome o Edge (mejor compatibilidad)
2. Limpiar cache (Ctrl+F5)
3. Probar en modo incógnito
4. Verificar que no haya extensiones bloqueando

---

## Diagnóstico Detallado del Módulo WhatsApp

### Abrir el demo principal:
```bash
start public\exports\demo-whatsapp.html
```

### Abrir consola (F12)

### Buscar estos mensajes en orden:

```
🚀 Iniciando generación de imagen...
  ↓
📊 Datos a exportar: {studs: 40, races: 15, totalPicks: 600}
  ↓
📱 Generando imagen WhatsApp...
  ↓
📐 Dimensiones del nodo: {width: 800, height: XXXX, scrollWidth: 800, scrollHeight: XXXX}
  ↓
🔍 Elementos hijos: XX
  ↓
📸 Iniciando captura...
  ↓
📸 Captura completada: XXXXX bytes
  ↓
✅ Imagen generada exitosamente: {size: "XXX.XX KB"}
✅ Imagen generada: XXX.XX KB
```

### Análisis de cada mensaje:

#### ✅ "📊 Datos a exportar"
- **studs** debe ser > 0
- **races** debe ser > 0
- **totalPicks** debe ser > 0

**Si son 0:** El problema es la extracción de datos, no la captura.

#### ✅ "📐 Dimensiones del nodo"
- **width** debe ser ~800
- **height** debe ser > 1000
- **scrollWidth** debe ser ~800
- **scrollHeight** debe ser > 1000

**Si height es 0 o muy pequeño:** Los elementos no se están renderizando.

#### ✅ "🔍 Elementos hijos"
- Debe ser > 50 (header + tabla + filas + celdas)

**Si es < 10:** La estructura HTML no se está construyendo correctamente.

#### ✅ "📸 Captura completada"
- Debe mostrar bytes > 0

**Si dice "blob es null":** html-to-image falló internamente.

#### ✅ "✅ Imagen generada"
- Size debe ser 200-500 KB

**Si es < 50 KB:** La imagen está en blanco o incompleta.

---

## Soluciones Según el Diagnóstico

### CASO 1: Los datos son correctos pero la imagen está en blanco

**Causa probable:** html-to-image no está capturando correctamente

**Soluciones:**

1. **Verificar versión del navegador:**
   ```javascript
   navigator.userAgent
   ```
   - Chrome 90+ ✅
   - Edge 90+ ✅
   - Firefox 88+ ✅
   - Safari 14+ ⚠️

2. **Probar con html2canvas como alternativa:**

   Agrega al HTML (antes del script del módulo):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
   ```

   Cambia en `whatsapp-pronosticos.js` (línea ~328):
   ```javascript
   // En lugar de:
   const blob = await window.htmlToImage.toBlob(node, {...});

   // Usa esto:
   const canvas = await window.html2canvas(node, {
     scale: 2,
     backgroundColor: this.colors.background,
     logging: true,
     useCORS: true
   });
   
   const blob = await new Promise(resolve => 
     canvas.toBlob(resolve, 'image/png')
   );
   ```

### CASO 2: Los elementos hijos son muy pocos (< 10)

**Causa probable:** La estructura HTML no se está construyendo

**Verificar:**
```javascript
// En la consola del demo, después de hacer clic:
const node = document.querySelector('[style*="position: fixed"]');
console.log('HTML:', node?.innerHTML);
```

**Si el HTML está vacío:** El problema está en `buildExportNode()`, `buildHeader()`, o `buildStudsTable()`.

### CASO 3: Las dimensiones son 0

**Causa probable:** El nodo no se está renderizando antes de capturar

**Soluciones:**

1. **Aumentar el tiempo de espera:**

   En `generateImage()`, cambia:
   ```javascript
   // Esperar más tiempo
   await new Promise(resolve => setTimeout(resolve, 500));
   ```

2. **Hacer el nodo visible temporalmente:**

   En `buildExportNode()`, cambia el z-index a positivo y quita cualquier opacidad.

### CASO 4: html-to-image lanza error

**Causa probable:** Incompatibilidad o bug en la librería

**Solución:** Usar html2canvas (ver CASO 1).

---

## Prueba Alternativa Rápida

Si nada funciona, puedes generar la imagen manualmente en la consola:

```javascript
// 1. Crear datos de prueba
const testData = {
  title: 'Test',
  date: '2026-04-10',
  track: 'Hipódromo',
  races: [{raceNumber: 1}, {raceNumber: 2}, {raceNumber: 3}],
  studs: [
    {name: 'Stud 1', picks: [{raceNumber: 1, pick: '5'}, {raceNumber: 2, pick: '3'}, {raceNumber: 3, pick: '8'}]},
    {name: 'Stud 2', picks: [{raceNumber: 1, pick: '2'}, {raceNumber: 2, pick: '7'}, {raceNumber: 3, pick: '1'}]}
  ]
};

// 2. Crear exportador
const exporter = new window.WhatsAppPicksExporter();

// 3. Construir nodo
const node = exporter.buildExportNode(testData);
document.body.appendChild(node);

// 4. Verificar que se ve (debería aparecer en pantalla)
console.log('Nodo visible?', node.getBoundingClientRect());

// 5. Capturar manualmente
setTimeout(async () => {
  const blob = await window.htmlToImage.toBlob(node, {
    pixelRatio: 2,
    backgroundColor: '#0a0f1a'
  });
  console.log('Blob:', blob);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  node.remove();
}, 1000);
```

---

## Checklist de Verificación

### Antes de pedir ayuda:

- [ ] Probé `test-simple.html` y sé si funciona o no
- [ ] Revisé todos los logs en la consola (F12)
- [ ] Verifiqué que `studs > 0` y `races > 0`
- [ ] Verifiqué que `Elementos hijos > 50`
- [ ] Verifiqué que las dimensiones son correctas
- [ ] Limpié cache del navegador (Ctrl+F5)
- [ ] Probé en Chrome/Edge
- [ ] Probé en modo incógnito
- [ ] Verifiqué que no hay extensiones bloqueando

### Información a proporcionar si sigue fallando:

1. **Navegador y versión:**
   ```javascript
   navigator.userAgent
   ```

2. **Screenshot de la consola** con todos los logs

3. **Resultado de:**
   ```javascript
   // Después de intentar generar imagen
   const node = document.querySelector('[style*="position: fixed"]');
   console.log({
     node: !!node,
     html: node?.innerHTML?.substring(0, 500),
     rect: node?.getBoundingClientRect(),
     children: node?.querySelectorAll('*')?.length
   });
   ```

4. **Screenshot de la imagen generada** (incluso si está en blanco)

---

## Archivos de Referencia

- **Test simple:** `public/exports/test-simple.html`
- **Demo completo:** `public/exports/demo-whatsapp.html`
- **Módulo:** `public/exports/whatsapp-pronosticos.js`
- **Bug fix doc:** `_bmad-output/bugfix-black-image.md`

---

**Última actualización:** 2026-04-10  
**Estado:** 🔍 Diagnóstico en curso
