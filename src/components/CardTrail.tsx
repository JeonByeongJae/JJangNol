import type { TrailCard, Role } from '../types/game'
import styles from './CardTrail.module.css'

interface Props {
  trail: TrailCard[]
  myRole: Role
  onCardTap?: (index: number) => void
  selectedIndices?: number[]
}

export default function CardTrail({ trail, myRole, onCardTap, selectedIndices = [] }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>카드 경로</div>
      <div className={styles.trail}>
        {trail.map((card, i) => {
          const isRevealed = card.face === 'revealed'
          const isSelected = selectedIndices.includes(i)
          const isGuessable = myRole === 'chaser' && !isRevealed && i > 0

          return (
            <div
              key={i}
              className={[
                styles.card,
                isRevealed ? styles.revealed : styles.faceDown,
                isSelected ? styles.selected : '',
                isGuessable ? styles.guessable : '',
              ].join(' ')}
              onClick={() => isGuessable && onCardTap?.(i)}
            >
              {isRevealed && (
                <span className={styles.value}>{card.value}</span>
              )}
              {myRole === 'runner' && !isRevealed && (
                <span className={styles.secretValue}>{card.value}</span>
              )}
              {!isRevealed && card.boosters && card.boosters.length > 0 && (
                <span className={styles.boosterBadge}>
                  +{card.boosters.reduce((s, b) => s + (b % 2 === 0 ? 2 : 1), 0)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
