import React, { useRef } from 'react'
import html2canvas from 'html2canvas'
import { useRanking } from '../hooks/useRanking'
import styles from './RankingTable.module.css'

export default function RankingTable() {
  const tableRef = useRef(null)
  const { campaignType, activeCampaign, ranking, premios, primerLugar, totalParticipants } = useRanking()

  const handleExportImage = async () => {
    if (!tableRef.current) return
    const canvas = await html2canvas(tableRef.current, {
      backgroundColor: '#0a0e17',
      scale: 2,
      useCORS: true,
      logging: false
    })
    const link = document.createElement('a')
    link.download = `ranking-${campaignType}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  }

  const top3 = ranking.slice(0, 3)
  const resto = ranking.slice(3)
  const mitad = Math.ceil(resto.length / 2)
  const colIzq = resto.slice(0, mitad)
  const colDer = resto.slice(mitad)

  const renderFila = (jugador) => {
    const diferencia = primerLugar - (jugador.points || 0)
    return (
      <div key={jugador.index || jugador.name} className={styles.restoRow}>
        <span className={styles.restoPos}>#{jugador.posicion}</span>
        <span className={styles.restoNombre}>{jugador.name}</span>
        <span className={styles.restoPts}>{(jugador.points || 0).toLocaleString('es-CL')}</span>
        <span className={styles.restoDiff}>-{diferencia}</span>
      </div>
    )
  }

  if (ranking.length === 0) {
    return (
      <div className={styles.rankingContainer}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏆</span>
          <p>No hay ranking para {campaignType}. Crea una campaña e ingresa pronósticos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.rankingContainer}>
      <div className={styles.rankingHeader}>
        <div>
          <h2 className={styles.rankingTitle}>
            🏆 Ranking {campaignType.charAt(0).toUpperCase() + campaignType.slice(1)}
          </h2>
          <p className={styles.rankingSubtitle}>
            {totalParticipants} studs • {activeCampaign?.name || ''}
          </p>
        </div>
        <button className={styles.exportBtn} onClick={handleExportImage}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar
        </button>
      </div>

      <div className={styles.tableWrapper} ref={tableRef}>
        <div className={styles.exportBanner}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerEmoji}>🏇</span>
            <div>
              <div className={styles.bannerTitle}>Polla Hípica — Ranking</div>
              <div className={styles.bannerMeta}>
                {activeCampaign?.name || campaignType} • {new Date().toLocaleDateString('es-CL')}
              </div>
            </div>
          </div>
          <div className={styles.bannerRight}>
            <span className={styles.bannerBadge}>{totalParticipants} studs</span>
          </div>
        </div>

        {/* TOP 3 */}
        <div className={styles.top3Section}>
          {top3.map((jugador, i) => {
            const premio = premios[i + 1]
            const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
            const colors = ['#fbbf24', '#9ca3af', '#d97706']
            const bgColors = ['rgba(251,191,36,0.08)', 'rgba(156,163,175,0.06)', 'rgba(217,119,6,0.06)']
            return (
              <div key={jugador.index || jugador.name} className={styles.top3Row} style={{ background: bgColors[i], borderColor: colors[i] + '33' }}>
                <span className={styles.top3Medal} style={{ fontSize: i === 0 ? '40px' : '32px' }}>{emoji}</span>
                <div className={styles.top3Info}>
                  <span className={styles.top3Nombre} style={{ fontSize: i === 0 ? '22px' : '18px' }}>{jugador.name}</span>
                  <span className={styles.top3Pts}>{(jugador.points || 0).toLocaleString('es-CL')} puntos</span>
                </div>
                <div className={styles.top3Prize}>
                  <span className={styles.prizeLabel}>Premio</span>
                  <span className={styles.prizeValue} style={{ color: colors[i] }}>${premio.toLocaleString('es-CL')}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* RESTO EN 2 COLUMNAS */}
        {resto.length > 0 && (
          <div className={styles.restoSection}>
            <div className={styles.restoColumns}>
              <div className={styles.restoColumn}>
                {colIzq.map(renderFila)}
              </div>
              <div className={styles.restoColumn}>
                {colDer.map(renderFila)}
              </div>
            </div>
          </div>
        )}

        <div className={styles.exportFooter}>
          <span>📊 Generado automáticamente • Polla Hípica {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  )
}
