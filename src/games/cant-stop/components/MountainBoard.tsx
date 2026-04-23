import { COLS } from '../utils/columns'
import type { CantStopRoomState, PlayerKey } from '../types'
import styles from './MountainBoard.module.css'

function PickaxeSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
      <line x1="5" y1="20" x2="17" y2="8" stroke="#a07830" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M9,5 C15,3 22,7 20,13 L18,11 C20,8 15,5 11,6 Z" fill="#c8a45a"/>
    </svg>
  )
}

function TentSVG({ color }: { color: 'green' | 'red' }) {
  const fill = color === 'green' ? '#1d6b1d' : '#6b1d1d'
  const stroke = color === 'green' ? '#3db83d' : '#cc3333'
  const inner = color === 'green' ? '#0d4a0d' : '#4a0d0d'
  return (
    <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
      <polygon points="12,4 3,20 21,20" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="12,4 7,20 17,20" fill={inner} stroke={stroke} strokeWidth="0.8"/>
      <rect x="9.5" y="14" width="5" height="6" rx="1.5" fill={stroke}/>
    </svg>
  )
}

interface Props {
  room: CantStopRoomState
  myKey: PlayerKey
  previewPositions?: Record<string, number>
}

export default function MountainBoard({ room, myKey, previewPositions = {} }: Props) {
  const oppKey: PlayerKey = myKey === 'host' ? 'guest' : 'host'

  return (
    <div className={styles.board}>
      {Object.entries(COLS).map(([colNum, size]) => {
        const col = Number(colNum)
        const key = String(col)
        const colState = room.board[key]
        const hasClimber = room.climbers?.[key] !== undefined
        const hasPreview = previewPositions[key] !== undefined

        return (
          <div key={col} className={styles.column}>
            {Array.from({ length: size }, (_, i) => {
              const pos = size - i
              const isTop = pos === size
              const climberPos = room.climbers?.[key]
              const previewPos = previewPositions[key]
              const myBasePos = colState?.[myKey] ?? 0
              const oppBasePos = colState?.[oppKey] ?? 0
              const locked = colState?.locked

              const isClimber = climberPos === pos
              const isPreview = !isClimber && previewPos === pos
              const isMyBase = !isClimber && !isPreview && myBasePos === pos
              const isOppBase = !isClimber && !isPreview && !isMyBase && oppBasePos === pos

              let cellClass = styles.cell
              if (isTop) cellClass += ` ${styles.cellTop}`
              if (isClimber) cellClass += ` ${styles.cellClimber}`
              else if (isPreview) cellClass += ` ${styles.cellPreview}`
              else if (isMyBase) cellClass += ` ${styles.cellMyBase}`
              else if (isOppBase) cellClass += ` ${styles.cellOppBase}`
              if (locked) cellClass += ` ${styles.cellLocked}`

              return (
                <div key={pos} className={cellClass}>
                  {isClimber && <PickaxeSVG />}
                  {isMyBase && <TentSVG color="green" />}
                  {isOppBase && <TentSVG color="red" />}
                </div>
              )
            })}
            <div className={`${styles.colLabel}${(hasClimber || hasPreview) ? ` ${styles.colLabelActive}` : ''}`}>
              {col}
            </div>
          </div>
        )
      })}
    </div>
  )
}
