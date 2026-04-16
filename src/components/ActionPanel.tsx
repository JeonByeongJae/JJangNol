import type { Role, Phase } from '../types/game'
import styles from './ActionPanel.module.css'

interface Props {
  myRole: Role
  turn: Role
  phase: Phase
  turnNumber: number
  placedThisTurn: number
  selectedBoosters: number[]
  pendingCard: number | null
  onConfirmPlace: () => void
  onPass: () => void
  onEndTurn: () => void
  onClearBoosters: () => void
  guessCount: number
  onSubmitGuess: () => void
  onEndChaserTurn: () => void
}

export default function ActionPanel({
  myRole, turn, phase, turnNumber,
  placedThisTurn, selectedBoosters, pendingCard,
  onConfirmPlace, onPass, onEndTurn, onClearBoosters,
  guessCount, onSubmitGuess, onEndChaserTurn,
}: Props) {
  const isMyTurn = turn === myRole
  if (!isMyTurn || phase === 'draw') return null

  if (myRole === 'runner') {
    const maxPlace = turnNumber === 0 ? 2 : 1
    const canPlaceMore = placedThisTurn < maxPlace

    return (
      <div className={styles.panel}>
        {selectedBoosters.length > 0 && (
          <div className={styles.boosterInfo}>
            부스터: {selectedBoosters.join(', ')} 선택됨
            <button className={styles.clearBtn} onClick={onClearBoosters}>✕</button>
          </div>
        )}
        <div className={styles.buttons}>
          {pendingCard !== null && (
            <button className={styles.primary} onClick={onConfirmPlace}>
              {pendingCard} 놓기
            </button>
          )}
          {placedThisTurn > 0 && !canPlaceMore && (
            <button className={styles.primary} onClick={onEndTurn}>
              턴 종료
            </button>
          )}
          {(placedThisTurn === 0 || (canPlaceMore && placedThisTurn > 0)) && pendingCard === null && (
            <button className={styles.secondary} onClick={onPass}>
              {placedThisTurn === 0 ? '패스 (턴 넘기기)' : '여기까지 (턴 종료)'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.buttons}>
        {guessCount > 0 && (
          <button className={styles.primary} onClick={onSubmitGuess}>
            추리 제출 ({guessCount}장)
          </button>
        )}
        <button className={styles.secondary} onClick={onEndChaserTurn}>
          {guessCount === 0 ? '패스 (턴 넘기기)' : '추리 취소'}
        </button>
      </div>
    </div>
  )
}
