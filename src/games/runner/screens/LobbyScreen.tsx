import type { GameRoom, Role } from '../types/game'
import styles from './LobbyScreen.module.css'

interface Props {
  room: GameRoom
  roomId: string
  myRole: Role
}

export default function LobbyScreen({ room, roomId, myRole }: Props) {
  const copyCode = () => navigator.clipboard.writeText(roomId)

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h2 className={styles.title}>대기 중</h2>

        <div className={styles.codeBox}>
          <p className={styles.codeLabel}>방 코드</p>
          <p className={styles.code}>{roomId}</p>
          <button className={styles.copyBtn} onClick={copyCode}>복사</button>
        </div>

        <p className={styles.hint}>친구에게 방 코드를 공유하세요</p>

        <div className={styles.players}>
          <div className={styles.player}>
            <span className={styles.roleIcon}>🏃</span>
            <span>{room.players.runner?.name ?? '—'}</span>
            <span className={styles.roleLabel}>도망자</span>
          </div>
          <div className={styles.player}>
            <span className={styles.roleIcon}>🔍</span>
            <span>{room.players.chaser?.name ?? '대기 중...'}</span>
            <span className={styles.roleLabel}>추격자</span>
          </div>
        </div>

        {!room.players.chaser && (
          <p className={styles.waiting}>상대방을 기다리는 중...</p>
        )}

        <p className={styles.myRole}>
          내 역할: {myRole === 'runner' ? '🏃 도망자' : '🔍 추격자'}
        </p>
      </div>
    </div>
  )
}
