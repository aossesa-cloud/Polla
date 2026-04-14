import React, { useState } from 'react'
import { carreras } from '../data/mockData'
import styles from './Pronosticos.module.css'

export default function Pronosticos() {
  const [selectedCarrera, setSelectedCarrera] = useState(1)
  const [pronostico, setPronostico] = useState('')

  const carreraActual = carreras.find(c => c.id === selectedCarrera)

  const studsDisponibles = ['Relámpago', 'Trueno', 'Centella', 'Tormenta', 'Huracán', 'Viento', 'Fuego', 'Rayo', 'Sombra', 'Estrella', 'Cometa', 'Pegaso']

  return (
    <div className={styles.pronosticos}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pronósticos</h1>
          <p className={styles.subtitle}>Ingresa tus picks para cada carrera</p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Seleccionar Carrera</h2>
          <div className={styles.carrerasGrid}>
            {carreras.map(c => (
              <button
                key={c.id}
                className={`${styles.carreraBtn} ${selectedCarrera === c.id ? styles.selected : ''} ${c.estado === 'finalizada' ? styles.finalizada : ''}`}
                onClick={() => setSelectedCarrera(c.id)}
                disabled={c.estado === 'finalizada'}
              >
                <span className={styles.carreraNum}>{c.numero}</span>
                <span className={styles.carreraStatus}>
                  {c.estado === 'finalizada' ? '✓' : c.estado === 'pendiente' ? '⏳' : '—'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {carreraActual && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              Carrera {carreraActual.numero} - {carreraActual.pista}
            </h2>
            
            <div className={styles.carreraInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Distancia</span>
                <span className={styles.infoValue}>{carreraActual.distancia}m</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Horario</span>
                <span className={styles.infoValue}>{carreraActual.horario}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={styles.infoValue}>{carreraActual.estado}</span>
              </div>
            </div>

            <div className={styles.inputSection}>
              <label className={styles.inputLabel}>Tu Pick (Stud)</label>
              <select 
                className={styles.select}
                value={pronostico}
                onChange={(e) => setPronostico(e.target.value)}
              >
                <option value="">Selecciona un stud...</option>
                {studsDisponibles.map(stud => (
                  <option key={stud} value={stud}>{stud}</option>
                ))}
              </select>

              <button 
                className={styles.submitBtn}
                disabled={!pronostico}
              >
                Enviar Pronóstico
              </button>
            </div>

            <div className={styles.recentPicks}>
              <h3 className={styles.picksTitle}>Pronósticos Recientes</h3>
              {[
                { jugador: 'Carlos M.', stud: 'Relámpago', hora: '14:32' },
                { jugador: 'Ana P.', stud: 'Centella', hora: '14:15' },
                { jugador: 'Roberto S.', stud: 'Trueno', hora: '13:58' }
              ].map((pick, i) => (
                <div key={i} className={styles.pickItem}>
                  <span className={styles.pickJugador}>{pick.jugador}</span>
                  <span className={styles.pickStud}>{pick.stud}</span>
                  <span className={styles.pickHora}>{pick.hora}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
