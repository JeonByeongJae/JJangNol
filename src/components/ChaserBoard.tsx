import type { BoardMark } from '../types/game'
import styles from './ChaserBoard.module.css'

interface Props {
  board: Record<number, BoardMark>
  onToggle?: (num: number) => void
}

const MARK_STYLE: Record<BoardMark, string> = {
  unknown: '',
  eliminated: styles.eliminated,
  correct: styles.correct,
}

export default function ChaserBoard({ board, onToggle }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>추리 보드</div>
      <div className={styles.grid}>
        {Array.from({ length: 42 }, (_, i) => {
          const num = i + 1
          const mark = board[num] ?? 'unknown'
          return (
            <button
              key={num}
              className={`${styles.cell} ${MARK_STYLE[mark]}`}
              onClick={() => onToggle?.(num)}
            >
              {num}
            </button>
          )
        })}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendCorrect}>■ 맞춤</span>
        <span className={styles.legendElim}>■ 제외</span>
      </div>
    </section>
  )
}
