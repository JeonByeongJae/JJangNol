import { useCallback } from 'react'
import { useRoom } from '../../../shared/hooks/useRoom'
import {
  subscribeRoom,
  rollDiceAction,
  stopClimbing,
  bust,
} from '../../../shared/firebase/cantStopDb'
import type { CantStopRoomState, PlayerKey } from '../types'
import { getDiceCombos, isComboPlayable } from '../utils/dice'

export function useCantStopGame(roomId: string | null, myKey: PlayerKey) {
  const { room, loading } = useRoom<CantStopRoomState>(roomId, subscribeRoom)

  const isMyTurn = room?.turn === myKey

  const combos = room?.dice?.length === 4
    ? getDiceCombos(room.dice)
    : []

  const comboPlayable = combos.map(combo =>
    room
      ? isComboPlayable(combo, room.board, room.climbers ?? {}, myKey)
      : false
  )

  const hasPlayableCombo = comboPlayable.some(Boolean)

  const handleRoll = useCallback(async (comboIdx: number | null) => {
    if (!roomId || !isMyTurn || !room) return
    const combo = comboIdx !== null ? combos[comboIdx] : undefined
    await rollDiceAction(roomId, combo)
  }, [roomId, isMyTurn, room, combos])

  const handleStop = useCallback(async (comboIdx: number | null) => {
    if (!roomId || !isMyTurn || !room) return
    const combo = comboIdx !== null ? combos[comboIdx] : undefined
    await stopClimbing(roomId, combo)
  }, [roomId, isMyTurn, room, combos])

  const handleBust = useCallback(async () => {
    if (!roomId) return
    await bust(roomId)
  }, [roomId])

  return {
    room,
    loading,
    isMyTurn,
    combos,
    comboPlayable,
    hasPlayableCombo,
    handleRoll,
    handleStop,
    handleBust,
  }
}
