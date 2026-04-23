import { useState } from 'react'
import type { CantStopRoomState } from '../types'
import { getDiceCombos } from '../utils/dice'
import styles from './ActionPanel.module.css'

interface Props {
  room: CantStopRoomState
  isMyTurn: boolean
  comboPlayable: boolean[]
  onRoll: (comboIdx: number | null) => void
  onStop: (comboIdx: number | null) => void
}

function getComboSplits(dice: number[]): [string, string][] {
  const [d1, d2, d3, d4] = dice
  return [
    [`${d1}+${d2}`, `${d3}+${d4}`],
    [`${d1}+${d3}`, `${d2}+${d4}`],
    [`${d1}+${d4}`, `${d2}+${d3}`],
  ]
}

export default function ActionPanel({
  room, isMyTurn, comboPlayable, onRoll, onStop,
}: Props) {
  const [selectedCombo, setSelectedCombo] = useState<number | null>(null)
  const dice = room.dice ?? []
  const combos = dice.length === 4 ? getDiceCombos(dice) : []
  const splits = dice.length === 4 ? getComboSplits(dice) : []
  const climberCount = Object.keys(room.climbers ?? {}).length

  if (!isMyTurn) {
    return (
      <div className={styles.panel}>
        <p className={styles.waitMsg}>상대방 차례입니다...</p>
      </div>
    )
  }

  const handleComboClick = (idx: number) => {
    if (!comboPlayable[idx]) return
    setSelectedCombo(idx === selectedCombo ? null : idx)
  }

  const handleRoll = () => {
    onRoll(selectedCombo)
    setSelectedCombo(null)
  }

  const handleStop = () => {
    onStop(selectedCombo)
    setSelectedCombo(null)
  }

  const mustSelectCombo = combos.length > 0 && selectedCombo === null

  return (
    <div className={styles.panel}>
      {dice.length === 4 && (
        <div className={styles.diceRow}>
          {dice.map((d, i) => (
            <div key={i} className={styles.die}>{d}</div>
          ))}
        </div>
      )}

      {combos.length > 0 && (
        <div className={styles.combos}>
          {combos.map((combo, idx) => {
            const playable = comboPlayable[idx]
            const selected = selectedCombo === idx
            return (
              <div
                key={idx}
                className={[
                  styles.comboCard,
                  selected ? styles.comboCardSelected : '',
                  !playable ? styles.comboCardDisabled : '',
                ].join(' ')}
                onClick={() => handleComboClick(idx)}
              >
                <div className={`${styles.comboSum}${selected ? ` ${styles.comboSumSelected}` : ''}`}>
                  {combo[0]} + {combo[1]}
                </div>
                <div className={styles.comboDetail}>
                  ({splits[idx][0]}) · ({splits[idx][1]})
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.btnRow}>
        <button
          className={`${styles.btn} ${styles.btnStop}`}
          onClick={handleStop}
          disabled={climberCount === 0 || mustSelectCombo}
        >
          ✓ 베이스캠프
        </button>
        <button
          className={`${styles.btn} ${styles.btnRoll}`}
          onClick={handleRoll}
          disabled={mustSelectCombo}
        >
          🎲 {room.rolledThisTurn ? '계속 굴리기' : '주사위 굴리기'}
        </button>
      </div>
    </div>
  )
}
