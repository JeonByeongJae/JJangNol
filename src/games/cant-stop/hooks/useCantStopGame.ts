import { useCallback, useRef, useState } from 'react'
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
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

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
    if (!roomId || !isMyTurn || !room || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const combo = comboIdx !== null ? combos[comboIdx] : undefined
      await rollDiceAction(roomId, combo)
    } catch (e) {
      console.error('[CantStop] rollDiceAction 실패:', e)
      alert('주사위 굴리기에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [roomId, isMyTurn, room, combos])

  const handleStop = useCallback(async (comboIdx: number | null) => {
    if (!roomId || !isMyTurn || !room || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const combo = comboIdx !== null ? combos[comboIdx] : undefined
      await stopClimbing(roomId, combo)
    } catch (e) {
      console.error('[CantStop] stopClimbing 실패:', e)
      const msg = e instanceof Error ? e.message : String(e)
      alert(`캠프 확정에 실패했습니다.\n${msg}`)
      throw e
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [roomId, isMyTurn, room, combos])

  const handleBust = useCallback(async () => {
    if (!roomId || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      await bust(roomId)
    } catch (e) {
      console.error('[CantStop] bust 실패:', e)
      alert('차례 넘기기에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [roomId])

  return {
    room,
    loading,
    isMyTurn,
    submitting,
    combos,
    comboPlayable,
    hasPlayableCombo,
    handleRoll,
    handleStop,
    handleBust,
  }
}
