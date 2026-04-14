import React from 'react'
import { carreras } from '../data/mockData'
import styles from './Resultados.module.css'

export default function Resultados() {
  const carrerasFinalizadas = carreras.filter(c => c.estado === 'finalizada')
  const carrerasPendientes = carreras.filter(c => c.estado === 'pendiente')

  return (
    <div className={styles.resultados}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Resultados</h1>
          <p className={styles.subtitle}>Resultados de las carreras del día</p>
        </div>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{carrerasFinalizadas.length}</span>
          <span className={styles.summaryLabel}>Finalizadas</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{carrerasPendientes.length}</span>
          <span className={styles.summaryLabel}>Pendientes</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{carreras.length}</span>
          <span className={styles.summaryLabel}>Total</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🏁 Carreras Finalizadas</h2>
        <div className={styles.resultsGrid}>
          {carrerasFinalizadas.map(carrera => (
            <div key={carrera.id} className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <span className={styles.resultNumber}>Carrera {carrera.numero}</span>
                <span className={styles.resultTime}>{carrera.horario}</span>
              </div>
              
              <div className={styles.resultDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Pista</span>
                  <span className={styles.detailValue}>{carrera.pista}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Distancia</span>
                  <span className={styles.detailValue}>{carrera.distancia}m</span>
                </div>
              </div>

              <div className={styles.winner}>
                <span className={styles.winnerLabel}>🏆 Ganador</span>
                <div className={styles.winnerInfo}>
                  <span className={styles.winnerStud}>{carrera.ganador.stud}</span>
                  <span className={styles.winnerJinete}>{carrera.ganador.jinete}</span>
                  <span className={styles.winnerCuota}>Cuota: {carrera.ganador.cuota}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>⏳ Carreras Pendientes</h2>
        <div className={styles.pendingList}>
          {carrerasPendientes.map(carrera => (
            <div key={carrera.id} className={styles.pendingItem}>
              <span className={styles.pendingNumber}>Carrera {carrera.numero}</span>
              <span className={styles.pendingInfo}>{carrera.pista} • {carrera.distancia}m</span>
              <span className={styles.pendingTime}>{carrera.horario}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
