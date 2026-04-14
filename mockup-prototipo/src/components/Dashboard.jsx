import React from 'react'
import styles from './Dashboard.module.css'

const statsCards = [
  { label: 'Jugadores Activos', value: '40', change: '+3 esta semana', icon: '👥' },
  { label: 'Campañas Activas', value: '3', change: 'Diaria, Semanal, Mensual', icon: '📋' },
  { label: 'Carreras Hoy', value: '12', change: '6 finalizadas', icon: '🏁' },
  { label: 'Pronósticos Hoy', value: '287', change: '92% completados', icon: '📝' }
]

const actividadReciente = [
  { hora: '14:32', texto: 'Carlos M. envió pronóstico para Carrera 8', tipo: 'pronostico' },
  { hora: '14:28', texto: 'Carrera 5 finalizada - Ganador: Relámpago', tipo: 'resultado' },
  { hora: '14:15', texto: 'Roberto S. se unió al Grupo Premium', tipo: 'grupo' },
  { hora: '13:58', texto: 'Carrera 4 finalizada - Ganador: Tormenta', tipo: 'resultado' },
  { hora: '13:45', texto: 'Ana P. envió pronóstico para Carrera 9', tipo: 'pronostico' },
  { hora: '13:30', texto: 'Carrera 3 finalizada - Ganador: Centella', tipo: 'resultado' }
]

export default function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Vista general de la Polla Hípica</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.date}>Viernes, 10 Abr 2026</span>
        </div>
      </header>

      <div className={styles.statsGrid}>
        {statsCards.map((card, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon}>{card.icon}</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{card.label}</span>
              <span className={styles.statValue}>{card.value}</span>
              <span className={styles.statChange}>{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Actividad Reciente</h2>
          <div className={styles.activityList}>
            {actividadReciente.map((item, i) => (
              <div key={i} className={styles.activityItem}>
                <span className={styles.activityTime}>{item.hora}</span>
                <span className={styles.activityText}>{item.texto}</span>
                <span className={`${styles.activityBadge} ${styles[item.tipo]}`}>
                  {item.tipo === 'pronostico' ? '📝' : item.tipo === 'resultado' ? '🏁' : '👥'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Campañas Activas</h2>
          <div className={styles.campaignList}>
            {[
              { nombre: 'Diaria - 10 Abr', progreso: 50, carreras: '6/12', jugadores: 28 },
              { nombre: 'Semanal - Semana 15', progreso: 32, carreras: '8/25', jugadores: 24 },
              { nombre: 'Mensual - Abril', progreso: 20, carreras: '5/25', jugadores: 40 }
            ].map((camp, i) => (
              <div key={i} className={styles.campaignItem}>
                <div className={styles.campaignHeader}>
                  <span className={styles.campaignName}>{camp.nombre}</span>
                  <span className={styles.campaignStatus}>Activa</span>
                </div>
                <div className={styles.campaignProgress}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${camp.progreso}%` }} />
                  </div>
                  <span className={styles.progressText}>{camp.carreras}</span>
                </div>
                <span className={styles.campaignPlayers}>{camp.jugadores} jugadores</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
