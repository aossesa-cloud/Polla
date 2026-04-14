import React from 'react'
import { detalleJugador, generarRanking } from '../data/mockData'
import styles from './PlayerDetail.module.css'

export default function PlayerDetail() {
  const jugador = detalleJugador
  const rankingDiario = generarRanking('diaria')
  const posicionDiaria = rankingDiario.find(r => r.jugadorId === jugador.id)?.posicion || '-'

  return (
    <div className={styles.detail}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Detalle del Jugador</h1>
          <p className={styles.subtitle}>Información completa de rendimiento</p>
        </div>
      </header>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarLarge}>{jugador.avatar}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.playerName}>{jugador.nombre}</h2>
            <span className={styles.grupoBadge}>{jugador.grupo}</span>
            <span className={styles.memberSince}>Miembro desde {new Date(jugador.miembroDesde).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        <div className={styles.statsOverview}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Ranking Diario</span>
            <span className={styles.statValue}>#{posicionDiaria}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Puntos Diarios</span>
            <span className={styles.statValue}>{jugador.campañas.diaria.puntos.toLocaleString('es-CL')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Efectividad</span>
            <span className={styles.statValue}>{((jugador.campañas.diaria.ganadas / jugador.campañas.diaria.jugadas) * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Campañas Ganadas</span>
            <span className={styles.statValue}>{jugador.campañas.diaria.ganadas + jugador.campañas.semanal.ganadas + jugador.campañas.mensual.ganadas}</span>
          </div>
        </div>
      </div>

      <div className={styles.campaignsGrid}>
        <div className={styles.campaignCard}>
          <h3 className={styles.campaignTitle}>📅 Campaña Diaria</h3>
          <div className={styles.campaignStats}>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Jugadas</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.diaria.jugadas}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Ganadas</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.diaria.ganadas}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Puntos</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.diaria.puntos.toLocaleString('es-CL')}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Ranking</span>
              <span className={styles.campaignStatValue}>#{jugador.campañas.diaria.ranking}</span>
            </div>
          </div>
        </div>

        <div className={styles.campaignCard}>
          <h3 className={styles.campaignTitle}>📆 Campaña Semanal</h3>
          <div className={styles.campaignStats}>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Jugadas</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.semanal.jugadas}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Ganadas</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.semanal.ganadas}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Puntos</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.semanal.puntos.toLocaleString('es-CL')}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Ranking</span>
              <span className={styles.campaignStatValue}>#{jugador.campañas.semanal.ranking}</span>
            </div>
          </div>
        </div>

        <div className={styles.campaignCard}>
          <h3 className={styles.campaignTitle}>🗓️ Campaña Mensual</h3>
          <div className={styles.campaignStats}>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Jugadas</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.mensual.jugadas}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Ganadas</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.mensual.ganadas}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Puntos</span>
              <span className={styles.campaignStatValue}>{jugador.campañas.mensual.puntos.toLocaleString('es-CL')}</span>
            </div>
            <div className={styles.campaignStat}>
              <span className={styles.campaignStatLabel}>Ranking</span>
              <span className={styles.campaignStatValue}>#{jugador.campañas.mensual.ranking}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>Historial de Carreras</h2>
        <div className={styles.historyTable}>
          <div className={styles.historyHeader}>
            <span className={styles.historyCol}>Carrera</span>
            <span className={styles.historyCol}>Stud</span>
            <span className={styles.historyCol}>Resultado</span>
            <span className={styles.historyCol}>Puntos</span>
          </div>
          <div className={styles.historyBody}>
            {jugador.historial.map((h, i) => (
              <div key={i} className={styles.historyRow}>
                <span className={styles.historyCol}>{h.carrera}</span>
                <span className={styles.historyCol}>{h.stud}</span>
                <span className={`${styles.historyCol} ${styles[h.resultado]}`}>
                  {h.resultado === 'acertó' ? '✓ Acertó' : h.resultado === 'falló' ? '✗ Falló' : '⏳ Pendiente'}
                </span>
                <span className={`${styles.historyCol} ${styles.pointsCol}`}>
                  {h.puntos > 0 ? `+${h.puntos}` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
