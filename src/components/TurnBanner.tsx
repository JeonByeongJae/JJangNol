import type { Role, Phase } from '../types/game'
import styles from './TurnBanner.module.css'

interface Props {
  turn: Role
  phase: Phase
  myRole: Role
  turnNumber: number
  drawsRemaining: number
}

function getMessage({ turn, phase, myRole, turnNumber, drawsRemaining }: Props): string {
  const isMyTurn = turn === myRole

  if (!isMyTurn) {
    return turn === 'runner' ? '도망자가 카드를 놓는 중...' : '추격자가 추리 중...'
  }

  if (phase === 'draw') {
    return `카드 더미에서 ${drawsRemaining}장을 뽑으세요`
  }

  if (myRole === 'runner') {
    return turnNumber === 0 ? '카드를 최대 2장 놓을 수 있습니다' : '카드를 놓거나 패스하세요'
  }

  return '추리할 카드를 선택하세요'
}

export default function TurnBanner(props: Props) {
  const isMyTurn = props.turn === props.myRole
  return (
    <div className={`${styles.banner} ${isMyTurn ? styles.myTurn : styles.waiting}`}>
      <span className={styles.role}>
        {isMyTurn ? (props.myRole === 'runner' ? '🏃 내 턴' : '🔍 내 턴') : '⏳ 대기'}
      </span>
      <span className={styles.message}>{getMessage(props)}</span>
    </div>
  )
}
