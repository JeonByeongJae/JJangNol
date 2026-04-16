import type { Role } from '../types/game'
import styles from './ResultScreen.module.css'

interface Props {
  winner: Role
  myRole: Role
  runnerName: string
  chaserName: string
  onPlayAgain: () => void
}

export default function ResultScreen({
  winner,
  myRole,
  runnerName,
  chaserName,
  onPlayAgain,
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

        <button className={styles.btn} onClick={onPlayAgain}>
          처음으로
        </button>
      </div>
    </div>
  )
}
