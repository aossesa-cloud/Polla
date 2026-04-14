# Mockup Prototipo - Polla Hípica

Prototipo visual completamente aislado del sistema principal. Enfocado en UX moderna y exportación de tablas para WhatsApp.

## Características

- ✅ **Modo oscuro** minimalista y elegante
- ✅ **7 pantallas**: Dashboard, Grupos, Campañas, Pronósticos, Resultados, Ranking, Detalle Jugador
- ✅ **Exportación a imagen** de alta resolución (optimizado para WhatsApp 1080px)
- ✅ **Soporte hasta 40 jugadores** con datos mock realistas
- ✅ **100% aislado** - no modifica código existente
- ✅ **Estilos de exportación personalizables** - 5 estilos predefinidos + editor de colores
- ✅ **Color Picker profesional** con gradiente, sliders RGB y cuentagotas
- ✅ **Vista previa en tiempo real** de la tabla antes de exportar

## Estructura

```
mockup-prototipo/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Navegación lateral
│   │   ├── Dashboard.jsx        # Vista general
│   │   ├── Groups.jsx           # Gestión de grupos
│   │   ├── Campaigns.jsx        # Lista de campañas
│   │   ├── Pronosticos.jsx      # Input de picks
│   │   ├── Resultados.jsx       # Resultados de carreras
│   │   ├── RankingTable.jsx     # Tabla de ranking (exportable)
│   │   └── PlayerDetail.jsx     # Detalle por jugador
│   ├── data/
│   │   └── mockData.js          # Datos de prueba
│   ├── App.jsx                  # Componente principal
│   ├── main.jsx                 # Entry point
│   └── *.css                    # Estilos modulares
├── index.html
├── vite.config.js
└── package.json
```

## Estilos de Exportación Personalizables

### 📸 6 Estilos Disponibles

| Estilo | Descripción | Uso Ideal |
|--------|-------------|-----------|
| 📘 **Excel Clásico** | Fondo blanco, header azul, picks naranja | WhatsApp (recomendado) |
| ⬜ **Minimalista Blanco** | Ultra limpio, bordes finos | Documentos formales |
| 📊 **Compacto Dense** | Celdas pequeñas, más filas visibles | Pantallas pequeñas |
| 🌙 **Azul Oscuro Premium** | Fondo oscuro elegante | Presentaciones |
| 🐎 **Hipódromo Clásico** | Rojo y dorado | Estilo tradicional |
| 🎨 **Personalizado** | Elige tus propios colores | Cualquier uso |

### 🎨 Editor de Colores Personalizado

Cuando seleccionas el estilo **"Personalizado"**, obtienes:

- **4 Color Pickers profesionales** con:
  - 🎯 Selector grande de gradiente (saturación/brillo)
  - 🌈 Slider de matiz (todos los colores del arcoíris)
  - 💧 Cuentagotas (selecciona color de cualquier parte de la pantalla)
  - 🔢 Inputs RGB individuales (0-255)
  - 🔢 Input hexadecimal (HEX)
  - 👁️ Vista previa circular del color seleccionado

- **4 colores configurables**:
  - Color del Header (título de la tabla)
  - Color de Picks (números pronosticados)
  - Color de Dividendos (ganancias)
  - Color de Fondo (fondo de la tabla)

- **Vista previa en tiempo real**:
  - Muestra la tabla completa mientras cambias colores
  - Se actualiza instantáneamente
  - Incluye datos de ejemplo (2 participantes, 4 carreras)

### 💾 Guardado por Campaña

Cada campaña guarda su propio estilo de exportación:

```javascript
{
  "exportStyle": "custom",  // o "excel-classic", "minimal-white", etc.
  "customColors": {
    "headerBg": "#777d82",
    "pickBg": "#de5c03",
    "divBg": "#070709",
    "bg": "#191616",
    "headerText": "#FFFFFF",
    "pickText": "#000000",
    "divText": "#FFFFFF"
  }
}
```

### 📤 Exportación PNG

Al exportar la tabla de pronósticos:

1. Selecciona la campaña con el estilo deseado
2. Haz click en **"📤 Exportar PNG"**
3. La imagen se genera usando los colores configurados
4. Se descarga automáticamente con el nombre: `pronosticos-YYYY-MM-DD.png`

## Instalación y Uso

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir http://localhost:3100
```

## Pantallas

### Dashboard
Vista general con estadísticas, actividad reciente y campañas activas.

### Grupos
Organización de jugadores en grupos (Premium, Standard, Nuevo).

### Campañas
Lista de campañas (diaria, semanal, mensual) con estado y progreso.

### Pronósticos
Interfaz simple para ingresar picks por carrera.

### Resultados
Resultados detallados de carreras finalizadas y pendientes.

### Ranking ⭐
Tabla de ranking con:
- Medallas para top 3
- Puntos, aciertos, rachas y tendencias
- **Botón de exportar como imagen** (alta resolución para WhatsApp)
- Selector de tipo de campaña (diaria/semanal/mensual)

### Detalle Jugador
Perfil completo con:
- Estadísticas generales
- Rendimiento por campaña
- Historial carrera por carrera

## Tecnologías

- **React 18** - UI library
- **Vite** - Build tool
- **html2canvas** - Exportación de tablas como imágenes
- **CSS Modules** - Estilos aislados por componente

## Notas

- Este mockup es **SOLO visual/prototipo**
- No necesita backend
- No se integra con el sistema actual
- Los datos son completamente ficticios (mockData.js)
