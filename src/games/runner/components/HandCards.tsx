import styles from './HandCards.module.css'

interface Props {
  hand: number[]
  playableCards: number[]
  selectedBoosters: number[]
  canPlay: boolean
  onCardClick: (card: number) => void
}

export default function HandCards({
  hand,
  playableCards,
  selectedBoosters,
  canPlay,
  onCardClick,
}: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>내 손패</div>
      <div className={styles.hand}>
        {hand.map(card => {
          const isPlayable = playableCards.includes(card)
          const isBooster = selectedBoosters.includes(card)
          return (
            <button
              key={card}
              className={[
                styles.card,
                isPlayable ? styles.playable : '',
                isBooster ? styles.booster : '',
              ].join(' ')}
              disabled={!canPlay}
              onClick={() => onCardClick(card)}
            >
              {card}
            </button>
          )
        })}
        {hand.length === 0 && (
          <span className={styles.empty}>손패 없음</span>
        )}
      </div>
    </section>
  )
}
