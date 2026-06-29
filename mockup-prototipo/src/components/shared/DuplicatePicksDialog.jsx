import React from 'react'
import styles from './DuplicatePicksDialog.module.css'

export default function DuplicatePicksDialog({
  groups = [],
  actionLabel = 'continuar',
  onConfirm,
  onCancel,
  onEditParticipant,
}) {
  if (!groups.length) return null

  const totalParticipants = groups.reduce((sum, group) => sum + group.members.length, 0)

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="duplicate-picks-title">
        <div className={styles.header}>
          <span className={styles.badge}>Revision necesaria</span>
          <h2 id="duplicate-picks-title">Hay pronosticos repetidos</h2>
          <p>
            Antes de generar la imagen, revisa estas coincidencias. Si estan correctas,
            confirma para {actionLabel}; si no, edita el participante que corresponda.
          </p>
        </div>

        <div className={styles.summary}>
          <strong>{groups.length}</strong> coincidencia{groups.length === 1 ? '' : 's'} detectada{groups.length === 1 ? '' : 's'}
          <span>{totalParticipants} participantes involucrados</span>
        </div>

        <div className={styles.groupList}>
          {groups.map((group, index) => (
            <article key={`${group.key}-${index}`} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <strong>{formatMembers(group.members)}</strong>
                <span>Mismos picks</span>
              </div>
              <div className={styles.picksLine}>{formatPicks(group.picks)}</div>
              {typeof onEditParticipant === 'function' && (
                <div className={styles.memberActions}>
                  {group.members.map((member) => (
                    <button
                      key={`${group.key}-${member.name}-${member.index}`}
                      type="button"
                      className={styles.editButton}
                      onClick={() => onEditParticipant(member)}
                    >
                      Editar {member.name}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Revisar antes
          </button>
          <button type="button" className={styles.confirmButton} onClick={onConfirm}>
            OK, {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatMembers(members = []) {
  return members.map((member) => member.name).join(' / ')
}

function formatPicks(picks = []) {
  return picks.map((pick) => pick || '-').join(' ')
}
