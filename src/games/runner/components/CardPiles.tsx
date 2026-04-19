import type { Piles, Pile } from '../types/game'
import styles from './CardPiles.module.css'

interface Props {
  piles: Piles
  canDraw: boolean
  onDraw: (pile: Pile) => void
}

const PILE_LABELS: Record<Pile, string> = {
  low: '4 – 14',
  mid: '15 – 29',
  high: '30 – 41',
}

export default function CardPiles({ piles, canDraw, onDraw }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>카드 더미</div>
      <div className={styles.piles}>
        {(['low', 'mid', 'high'] as Pile[]).map(pile => (
          <button
            key={pile}
            className={`${styles.pile} ${canDraw && piles[pile].length > 0 ? styles.active : ''}`}
            disabled={!canDraw || piles[pile].length === 0}
            onClick={() => onDraw(pile)}
          >
            <div className={styles.pileLabel}>{PILE_LABELS[pile]}</div>
            <div className={styles.cardBack} />
            <div className={styles.count}>{piles[pile].length}장</div>
          </button>
        ))}
      </div>
    </section>
  )
}
