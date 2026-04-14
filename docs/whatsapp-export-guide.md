# Exportación de Pronósticos para WhatsApp

## Descripción

Sistema de generación de imágenes optimizadas para WhatsApp que muestra **TODAS** las carreras y **TODOS** los participantes de un vistazo.

## Características

### Diseño Optimizado para WhatsApp
- **Formato vertical**: Mejor aprovechamiento de la vista previa en chats
- **Ancho fijo**: 800px (óptimo para WhatsApp)
- **Alto variable**: Se adapta automáticamente según la cantidad de contenido
- **Tipografía grande**: Legible en pantallas móviles

### Información Mostrada
- ✅ Header con nombre de la polla, fecha e hipódromo
- ✅ Todos los participantes (hasta 40+)
- ✅ Todas las carreras (hasta 25+)
- ✅ Pronóstico de cada participante por carrera
- ✅ Retiros marcados visualmente (✗ en rojo)
- ✅ Footer con resumen de participantes y carreras

### Colores y Estilo
- Fondo oscuro (#0a0f1a) para contraste
- Header con gradiente verde (identidad hípica)
- Filas alternadas para mejor legibilidad
- Números de pronóstico en celdas grises claras

## Cómo Usar

### Desde la Interfaz
1. Navega a cualquier vista (Diaria, Semanal, Mensual)
2. Busca la tabla de "Pronósticos registrados"
3. Haz clic en el botón **📱 WhatsApp**
4. La imagen se generará y podrás:
   - **Compartir directamente** (en móviles abre WhatsApp)
   - **Descargar** como archivo PNG

### Desde Código

```javascript
// Importar el módulo
const { WhatsAppPicksExporter } = await import('./exports/whatsapp-pronosticos.js');

// Extraer datos de un evento
const exportData = WhatsAppPicksExporter.extractEventData(event);

// Crear exportador y generar imagen
const exporter = new WhatsAppPicksExporter({
  width: 800,
  padding: 32
});

const blob = await exporter.generateImage(exportData);

// Compartir o descargar
await exporter.shareImage(blob, 'pronosticos-whatsapp');
// o
await exporter.downloadImage(blob, 'pronosticos-whatsapp');
```

## Estructura de Datos del Evento

El evento debe tener esta estructura:

```javascript
{
  id: "event-id",
  date: "2026-04-10",
  trackName: "Hipódromo Chile",
  trackId: "hipodromo-chile",
  races: 15,
  campaign: {
    name: "Polla Diaria"
  },
  participants: [
    {
      name: "Stud El Rayo",
      picks: [
        {
          raceNumber: 1,
          horse: "5",
          withdrawn: false
        },
        {
          raceNumber: 2,
          horse: "3",
          withdrawn: true  // Ejemplar retirado
        }
      ]
    }
  ]
}
```

## Personalización

Puedes ajustar los parámetros del exportador:

```javascript
const exporter = new WhatsAppPicksExporter({
  width: 800,                    // Ancho de la imagen
  padding: 32,                   // Padding interno
  headerFontSize: 36,            // Tamaño del título
  subheaderFontSize: 22,         // Tamaño de subtítulo
  studNameFontSize: 18,          // Nombre de participante
  pickNumberFontSize: 16,        // Número de pronóstico
  raceHeaderFontSize: 16,        // Headers de carreras
  footerFontSize: 20             // Footer
});
```

## Archivos

- **Módulo principal**: `public/exports/whatsapp-pronosticos.js`
- **Integración UI**: `public/legacy/app-legacy.js` (función `bindWhatsAppExport()`)
- **HTML**: `public/index.html` (carga del módulo)

## Tecnologías

- **html-to-image**: Captura de DOM a imagen PNG (ya incluido en el proyecto)
- **Web Share API**: Para compartir en móviles
- **CSS Grid**: Para layout de la tabla

## Consideraciones de Rendimiento

### Con 40 participantes × 25 carreras:
- **Tiempo de generación**: ~1-2 segundos
- **Tamaño de imagen**: ~200-500 KB (PNG)
- **Dimensiones típicas**: 800px × 3000-5000px

### Optimizaciones:
- Pixel ratio de 2x para calidad en retina
- Uso de CSS Grid para mejor rendimiento
- Eliminación inmediata del nodo DOM tras captura

## Solución de Problemas

### "No se encontró el evento para exportar"
- Verifica que el evento exista y tenga participantes cargados
- Revisa la consola del navegador para más detalles

### "No se pudo generar la imagen"
- Asegúrate de que html-to-image esté cargado (window.htmlToImage)
- Verifica que haya participantes y carreras en el evento

### La imagen se ve cortada
- El diseño es intencionalmente vertical para WhatsApp
- Si son demasiados datos, considera dividir en grupos

### No se puede compartir en WhatsApp
- En desktop, se descarga el archivo automáticamente
- En móviles, se abre el menú de compartir nativo
- WhatsApp Web requiere descargar y arrastrar manualmente

## Próximas Mejoras

- [ ] Soporte para múltiples jornadas en una imagen
- [ ] Incluir logos personalizados
- [ ] Modo horizontal opcional
- [ ] Texto adicional descriptivo
- [ ] Marca de agua con nombre del stud
- [ ] QR para enlace directo a la polla
