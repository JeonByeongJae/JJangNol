import { useState } from 'react'
import { useCantStopGame } from '../hooks/useCantStopGame'
import MountainBoard from '../components/MountainBoard'
import ActionPanel from '../components/ActionPanel'
import { getDiceCombos } from '../utils/dice'
import { COLS } from '../utils/columns'
import { updatePendingCombo } from '../../../shared/firebase/cantStopDb'
import type { CantStopRoomState, PlayerKey } from '../types'
import styles from './GameScreen.module.css'

interface Props {
  roomId: string
  myKey: PlayerKey
}

function calcPreviewPositions(
  room: CantStopRoomState,
  player: PlayerKey,
  combo: [number, number],
  forcedCol?: number
): Record<string, number> {
  const climbers = { ...(room.climbers ?? {}) }
  const result: Record<string, number> = {}
  for (const col of combo) {
    if (forcedCol !== undefined && col !== forcedCol) continue
    const key = String(col)
    const colState = room.board[key]
    if (!colState || colState.locked != null) continue
    if (climbers[key] !== undefined) {
      if (climbers[key] < COLS[col]) {
        climbers[key] += 1
        result[key] = climbers[key]
      }
    } else if (Object.keys(climbers).length < 3) {
      climbers[key] = (colState[player] ?? 0) + 1
      result[key] = climbers[key]
    }
  }
  return result
}

// 두 열이 모두 새 열인데 슬롯이 1개만 남은 경우 - 플레이어가 선택해야 함
function getPartialCols(
  comboIdx: number | null,
  combos: [number, number][],
  room: CantStopRoomState
): [number, number] | null {
  if (comboIdx === null) return null
  const combo = combos[comboIdx]
  if (!combo || combo[0] === combo[1]) return null
  const [a, b] = combo
  const climbersMap = room.climbers ?? {}
  if (Object.keys(climbersMap).length !== 2) return null
  if (String(a) in climbersMap || String(b) in climbersMap) return null
  const aValid = COLS[a] != null && !room.board[String(a)]?.locked
  const bValid = COLS[b] != null && !room.board[String(b)]?.locked
  return (aValid && bValid) ? [a, b] : null
}

export default function GameScreen({ roomId, myKey }: Props) {
  const [selectedCombo, setSelectedCombo] = useState<number | null>(null)
  const [singleColChoice, setSingleColChoice] = useState<number | null>(null)

  const {
    room, loading, isMyTurn, submitting,
    combos, comboPlayable, hasPlayableCombo,
    handleRoll, handleStop, handleBust,
  } = useCantStopGame(roomId, myKey)

  if (loading || !room) {
    return <div style={{ color: '#a08060', padding: 24, textAlign: 'center' }}>연결 중...</div>
  }

  const oppKey: PlayerKey = myKey === 'host' ? 'guest' : 'host'

  const partialCols = isMyTurn ? getPartialCols(selectedCombo, combos, room) : null

  const previewPositions = (isMyTurn && selectedCombo !== null && combos[selectedCombo])
    ? calcPreviewPositions(room, myKey, combos[selectedCombo], singleColChoice ?? undefined)
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
    setSingleColChoice(null)
    if (isMyTurn) {
      updatePendingCombo(roomId, idx).catch(e => console.error('pendingComboIdx 동기화 실패:', e))
    }
  }

  const handleRollWithOverride = (comboIdx: number | null) => {
    handleRoll(comboIdx, singleColChoice ?? undefined)
    setSingleColChoice(null)
  }

  const handleStopWithOverride = async (comboIdx: number | null) => {
    await handleStop(comboIdx, singleColChoice ?? undefined)
    setSingleColChoice(null)
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
          onRoll={handleRollWithOverride}
          onStop={handleStopWithOverride}
          onBust={handleBust}
          pendingComboIdx={oppPendingIdx}
          partialCols={partialCols}
          singleColChoice={singleColChoice}
          onSelectSingleCol={setSingleColChoice}
        />
      </div>
    </div>
  )
}
