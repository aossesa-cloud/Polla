import React, { useState } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import styles from './Login.module.css'

export default function Login({ onSuccess, onCancel, isModal = false }) {
  const [mode, setMode] = useState('pin')
  const [pin, setPin] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAppStore()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let credentials
      if (mode === 'pin') {
        credentials = { pin }
      } else {
        credentials = { username, password }
      }

      await login(credentials)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <span className={styles.logoEmoji}>🏇</span>
          <h1 className={styles.logoTitle}>Polla Hípica</h1>
          <p className={styles.logoSubtitle}>Acceso de Administrador</p>
        </div>

        {/* Mode selector */}
        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeBtn} ${mode === 'pin' ? styles.active : ''}`}
            onClick={() => { setMode('pin'); setError('') }}
          >
            🔑 PIN
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'user' ? styles.active : ''}`}
            onClick={() => { setMode('user'); setError('') }}
          >
            👤 Usuario
          </button>
        </div>

        <form onSubmit={handleLogin}>
          {mode === 'pin' ? (
            <div className={styles.field}>
              <label className={styles.label}>PIN de Admin</label>
              <input
                className={styles.input}
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ingresa el PIN"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Usuario</label>
                <input
                  className={styles.input}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contraseña</label>
                <input
                  className={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                />
              </div>
            </>
          )}

          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || (mode === 'pin' ? !pin : !username || !password)}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        {onCancel && (
          <button className={styles.cancelBtn} onClick={onCancel}>
            ✕ Cancelar
          </button>
        )}

        <p className={styles.hint}>
          Ingresa tus credenciales para acceder al panel de control
        </p>
      </div>
    </div>
  )
}
