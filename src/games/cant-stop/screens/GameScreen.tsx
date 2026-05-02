import { useState } from 'react'
import { useCantStopGame } from '../hooks/useCantStopGame'
import MountainBoard from '../components/MountainBoard'
import ActionPanel from '../components/ActionPanel'
import { getDiceCombos } from '../utils/dice'
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
    room, loading, isMyTurn, submitting,
    combos, comboPlayable, hasPlayableCombo,
    handleRoll, handleStop, handleBust,
    syncPendingCombo,
  } = useCantStopGame(roomId, myKey)

  if (loading || !room) {
    return <div style={{ color: '#a08060', padding: 24, textAlign: 'center' }}>연결 중...</div>
  }

  const oppKey: PlayerKey = myKey === 'host' ? 'guest' : 'host'

  const previewPositions = (isMyTurn && selectedCombo !== null && combos[selectedCombo])
    ? calcPreviewPositions(room, myKey, combos[selectedCombo])
    : {}

  const oppPendingIdx = room.pendingComboIdx ?? null
  const oppCombos = room.dice?.length === 4 ? getDiceCombos(room.dice) : []
  const oppPreviewPositions = (!isMyTurn && oppPendingIdx !== null && oppCombos[oppPendingIdx])
    ? calcPreviewPositions(room, oppKey, oppCombos[oppPendingIdx])
    : {}

  const climberCount = Object.keys(room.climbers ?? {}).length
  const bannerText = isMyTurn
    ? `⛰️ 내 차례 — 등반 중 (등반자 ${climberCount}/3)`
    : `상대방 차례`

  const handleSelectCombo = (idx: number | null) => {
    setSelectedCombo(idx)
    syncPendingCombo(idx)
  }

  return (
    <div className={styles.screen}>
      <div className={styles.banner}>{bannerText}</div>
      <div className={styles.content}>
        <MountainBoard
          room={room}
          myKey={myKey}
          previewPositions={previewPositions}
          oppPreviewPositions={oppPreviewPositions}
        />
        <ActionPanel
          room={room}
          isMyTurn={isMyTurn}
          submitting={submitting}
          comboPlayable={comboPlayable}
          hasPlayableCombo={hasPlayableCombo}
          selectedCombo={selectedCombo}
          onSelectCombo={handleSelectCombo}
          onRoll={handleRoll}
          onStop={handleStop}
          onBust={handleBust}
          pendingComboIdx={oppPendingIdx}
        />
      </div>
    </div>
  )
}
