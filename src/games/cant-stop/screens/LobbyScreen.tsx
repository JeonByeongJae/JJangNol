// src/games/cant-stop/screens/LobbyScreen.tsx
import type { CantStopRoomState, PlayerKey } from '../types'
import styles from './LobbyScreen.module.css'

interface Props {
  room: CantStopRoomState
  roomId: string
  myKey: PlayerKey
}

export default function LobbyScreen({ room, roomId }: Props) {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h2 className={styles.title}>⛰️ CAN'T STOP</h2>

        <div>
          <p className={styles.codeLabel}>방 코드</p>
          <p className={styles.code}>{roomId}</p>
        </div>

        <div className={styles.playerList}>
          <div className={styles.player}>
            <span>{room.players.host?.name ?? '—'}</span>
            <span className={styles.playerReady}>방장</span>
          </div>
          <div className={styles.player}>
            <span>{room.players.guest?.name ?? '—'}</span>
            {!room.players.guest && (
              <span className={styles.waiting}>대기 중...</span>
            )}
          </div>
        </div>

        <p className={styles.waiting}>
          {room.players.guest ? '게임 시작 중...' : '상대방을 기다리는 중...'}
        </p>
      </div>
    </div>
  )
}
