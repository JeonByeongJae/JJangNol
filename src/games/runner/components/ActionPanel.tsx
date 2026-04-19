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
  onClearBoosters: () => void
  guessCount: number
  onSubmitGuess: () => void
  onEndChaserTurn: () => void
  onClearGuess: () => void
}

export default function ActionPanel({
  myRole, turn, phase, turnNumber,
  placedThisTurn, selectedBoosters, pendingCard,
  onConfirmPlace, onPass, onClearBoosters,
  guessCount, onSubmitGuess, onEndChaserTurn, onClearGuess,
}: Props) {
  const isMyTurn = turn === myRole
  if (!isMyTurn || phase === 'draw') return null

  if (myRole === 'runner') {
    const isFirstTurn = turnNumber === 0
    const canPlaceMore = placedThisTurn < (isFirstTurn ? 2 : 1)

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
          {/* 첫 턴 1장 배치 후 조기 종료 또는 아직 아무것도 안 놓았을 때 패스 */}
          {canPlaceMore && pendingCard === null && (
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
        {guessCount > 0 ? (
          <>
            <button className={styles.primary} onClick={onSubmitGuess}>
              추리 제출 ({guessCount}장)
            </button>
            <button className={styles.secondary} onClick={onClearGuess}>
              초기화
            </button>
          </>
        ) : (
          <button className={styles.secondary} onClick={onEndChaserTurn}>
            패스 (턴 넘기기)
          </button>
        )}
      </div>
    </div>
  )
}
