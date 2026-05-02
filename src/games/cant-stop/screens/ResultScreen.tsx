import type { CantStopRoomState, PlayerKey } from '../types'
import styles from './ResultScreen.module.css'

interface Props {
  room: CantStopRoomState
  myKey: PlayerKey
  onPlayAgain: () => void
  onHome: () => void
}

export default function ResultScreen({ room, myKey, onPlayAgain, onHome }: Props) {
  const iWon = room.winner === myKey
  const myName = room.players[myKey]?.name ?? '나'
  const oppKey: PlayerKey = myKey === 'host' ? 'guest' : 'host'
  const oppName = room.players[oppKey]?.name ?? '상대'
  const winnerName = iWon ? myName : oppName

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={`${styles.resultTitle} ${iWon ? styles.win : styles.lose}`}>
          {iWon ? '🏆 승리!' : '😔 패배'}
        </h1>
        <p className={styles.message}>
          {winnerName}님이 3개의 등반로를 완료했습니다!
        </p>
        <button className={styles.playAgainBtn} onClick={onPlayAgain}>
          한판 더 하기
        </button>
        <button className={styles.homeBtn} onClick={onHome}>
          처음으로
        </button>
      </div>
    </div>
  )
}
