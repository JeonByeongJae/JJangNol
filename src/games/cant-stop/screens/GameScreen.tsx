import { useCantStopGame } from '../hooks/useCantStopGame'
import MountainBoard from '../components/MountainBoard'
import ActionPanel from '../components/ActionPanel'
import type { PlayerKey } from '../types'
import styles from './GameScreen.module.css'

interface Props {
  roomId: string
  myKey: PlayerKey
}

export default function GameScreen({ roomId, myKey }: Props) {
  const {
    room, loading, isMyTurn,
    comboPlayable,
    handleRoll, handleStop,
  } = useCantStopGame(roomId, myKey)

  if (loading || !room) {
    return <div style={{ color: '#a08060', padding: 24, textAlign: 'center' }}>연결 중...</div>
  }

  const climberCount = Object.keys(room.climbers ?? {}).length
  const bannerText = isMyTurn
    ? `⛰️ 내 차례 — 등반 중 (등반자 ${climberCount}/3)`
    : `상대방 차례`

  return (
    <div className={styles.screen}>
      <div className={styles.banner}>{bannerText}</div>
      <div className={styles.content}>
        <MountainBoard room={room} myKey={myKey} />
        <ActionPanel
          room={room}
          isMyTurn={isMyTurn}
          comboPlayable={comboPlayable}
          onRoll={handleRoll}
          onStop={handleStop}
        />
      </div>
    </div>
  )
}
