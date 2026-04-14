/**
 * RouteGuards.jsx
 * 
 * Componentes de protección de rutas:
 * - ProtectedRoute: Requiere autenticación
 * - PublicRoute: Accesible sin autenticación
 */

import React, { useEffect } from 'react'
import { getDefaultView } from '../config/routes'

/**
 * ProtectedRoute: Redirige al login si no está autenticado
 */
export function ProtectedRoute({ isAuthenticated, children, onNavigate }) {
  useEffect(() => {
    if (!isAuthenticated && onNavigate) {
      // Redirigir a vista pública por defecto
      onNavigate(getDefaultView(false))
    }
  }, [isAuthenticated, onNavigate])

  if (!isAuthenticated) {
    return null
  }

  return children
}

/**
 * PublicRoute: Accesible para todos (sin login requerido)
 */
export function PublicRoute({ children }) {
  return children
}

/**
 * AuthRedirect: Redirige al dashboard si ya está autenticado
 */
export function AuthRedirect({ isAuthenticated, children, onNavigate }) {
  useEffect(() => {
    if (isAuthenticated && onNavigate) {
      // Si ya está logueado y trata de acceder a login, redirigir al dashboard
      onNavigate(getDefaultView(true))
    }
  }, [isAuthenticated, onNavigate])

  return children
}
