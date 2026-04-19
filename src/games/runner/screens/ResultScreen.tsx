import type { Role, TrailCard } from '../types/game'
import styles from './ResultScreen.module.css'

interface Props {
  winner: Role
  myRole: Role
  runnerName: string
  chaserName: string
  trail: TrailCard[]
  onPlayAgain: () => void
  onRematch?: () => void
  onRematchSwap?: () => void
}

export default function ResultScreen({
  winner,
  myRole,
  runnerName,
  chaserName,
  trail,
  onPlayAgain,
  onRematch,
  onRematchSwap,
}: Props) {
  const iWon = winner === myRole
  const winnerName = winner === 'runner' ? runnerName : chaserName

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.resultIcon}>{iWon ? '🏆' : '💀'}</div>
        <h2 className={styles.result}>{iWon ? '승리!' : '패배'}</h2>
        <p className={styles.winnerText}>
          {winner === 'runner' ? '🏃 도망자' : '🔍 추격자'}{' '}
          <span className={styles.winnerName}>{winnerName}</span> 승리
        </p>

        <div className={styles.players}>
          <div className={styles.playerRow}>
            <span>🏃 {runnerName}</span>
            {winner === 'runner' && <span className={styles.badge}>승</span>}
          </div>
          <div className={styles.playerRow}>
            <span>🔍 {chaserName}</span>
            {winner === 'chaser' && <span className={styles.badge}>승</span>}
          </div>
        </div>

        <div className={styles.trailSection}>
          <div className={styles.trailLabel}>카드 배열 정답</div>
          <div className={styles.trailCards}>
            {trail.map((card, i) => (
              <div key={i} className={styles.trailCard}>
                <span className={styles.trailValue}>{card.value}</span>
                {card.boosters && card.boosters.length > 0 && (
                  <span className={styles.trailBooster}>
                    {card.boosters.join(' ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          {onRematch && (
            <button className={styles.rematchBtn} onClick={onRematch}>
              역할 유지 다시 하기
            </button>
          )}
          {onRematchSwap && (
            <button className={styles.rematchBtn} onClick={onRematchSwap}>
              역할 바꿔서 다시 하기
            </button>
          )}
          <button className={styles.btn} onClick={onPlayAgain}>
            처음으로
          </button>
        </div>
      </div>
    </div>
  )
}
