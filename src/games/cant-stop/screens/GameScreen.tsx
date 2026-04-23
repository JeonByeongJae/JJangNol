import { useState } from 'react'
import { useCantStopGame } from '../hooks/useCantStopGame'
import MountainBoard from '../components/MountainBoard'
import ActionPanel from '../components/ActionPanel'
import type { CantStopRoomState, PlayerKey } from '../types'
import styles from './GameScreen.module.css'

interface Props {
  roomId: string
  myKey: PlayerKey
}

function calcPreviewPositions(
  room: CantStopRoomState,
  player: PlayerKey,
  combo: [number, number]
): Record<string, number> {
  const climbers = { ...(room.climbers ?? {}) }
  const result: Record<string, number> = {}
  for (const col of combo) {
    const key = String(col)
    const colState = room.board[key]
    if (!colState || colState.locked != null) continue
    if (climbers[key] !== undefined) {
      climbers[key] += 1
      result[key] = climbers[key]
    } else if (Object.keys(climbers).length < 3) {
      climbers[key] = (colState[player] ?? 0) + 1
      result[key] = climbers[key]
    }
  }
  return result
}

export default function GameScreen({ roomId, myKey }: Props) {
  const [selectedCombo, setSelectedCombo] = useState<number | null>(null)

  const {
    room, loading, isMyTurn,
    combos, comboPlayable, hasPlayableCombo,
    handleRoll, handleStop, handleBust,
  } = useCantStopGame(roomId, myKey)

  if (loading || !room) {
    return <div style={{ color: '#a08060', padding: 24, textAlign: 'center' }}>연결 중...</div>
  }

  const previewPositions = (isMyTurn && selectedCombo !== null && combos[selectedCombo])
    ? calcPreviewPositions(room, myKey, combos[selectedCombo])
    : {}

  const climberCount = Object.keys(room.climbers ?? {}).length
  const bannerText = isMyTurn
    ? `⛰️ 내 차례 — 등반 중 (등반자 ${climberCount}/3)`
    : `상대방 차례`

  return (
    <div className={styles.screen}>
      <div className={styles.banner}>{bannerText}</div>
      <div className={styles.content}>
        <MountainBoard room={room} myKey={myKey} previewPositions={previewPositions} />
        <ActionPanel
          room={room}
          isMyTurn={isMyTurn}
          comboPlayable={comboPlayable}
          hasPlayableCombo={hasPlayableCombo}
          selectedCombo={selectedCombo}
          onSelectCombo={setSelectedCombo}
          onRoll={handleRoll}
          onStop={handleStop}
          onBust={handleBust}
        />
      </div>
    </div>
  )
}
