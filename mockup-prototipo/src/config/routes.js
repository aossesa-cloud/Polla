/**
 * routes.js
 * 
 * Configuración de rutas públicas y privadas.
 * 
 * Vistas Públicas (sin login):
 * - resultados
 * - pronosticos
 * - ranking
 * - premios
 * 
 * Vistas Privadas (requieren login):
 * - dashboard
 * - grupos
 * - campanas
 * - calendario
 * - programa
 * - ingreso
 * - settings
 */

// Vistas accesibles sin autenticación (solo lectura)
export const PUBLIC_VIEWS = new Set([
  'resultados',
  'pronosticos',
  'ranking',
  'premios',
])

// Vistas que requieren autenticación
export const PRIVATE_VIEWS = new Set([
  'dashboard',
  'grupos',
  'campanas',
  'calendario',
  'programa',
  'ingreso',
  'settings',
])

/**
 * Verificar si una vista es pública
 */
export function isPublicView(viewId) {
  return PUBLIC_VIEWS.has(viewId)
}

/**
 * Verificar si una vista requiere autenticación
 */
export function isPrivateView(viewId) {
  return PRIVATE_VIEWS.has(viewId)
}

/**
 * Obtener la vista por defecto según estado de auth
 */
export function getDefaultView(isAuthenticated) {
  return isAuthenticated ? 'campanas' : 'pronosticos'
}

/**
 * Filtrar items de navegación según auth
 */
export function getAvailableNavItems(isAuthenticated) {
  const allItems = [
    { id: 'dashboard', label: 'Panel', icon: 'dashboard', requiresAuth: true },
    { id: 'grupos', label: 'Grupos', icon: 'grupos', requiresAuth: true },
    { id: 'campanas', label: 'Campañas', icon: 'campanas', requiresAuth: true },
    { id: 'calendario', label: 'Calendario', icon: 'calendario', requiresAuth: true },
    { id: 'programa', label: 'Programa', icon: 'programa', requiresAuth: true },
    { id: 'resultados', label: 'Resultados', icon: 'resultados', requiresAuth: false },
    { id: 'ingreso', label: 'Ingreso Picks', icon: 'ingreso', requiresAuth: true },
    { id: 'pronosticos', label: 'Tabla Pronósticos', icon: 'pronosticos', requiresAuth: false },
    { id: 'ranking', label: 'Ranking', icon: 'ranking', requiresAuth: false },
    { id: 'premios', label: 'Premios', icon: 'premios', requiresAuth: false },
    { id: 'settings', label: 'Estilos', icon: 'settings', requiresAuth: true },
  ]

  if (isAuthenticated) {
    return allItems
  }

  return allItems.filter(item => !item.requiresAuth)
}
