import { useRef, useEffect } from 'react'
import type { TrailCard, Role } from '../types/game'
import styles from './CardTrail.module.css'

interface Props {
  trail: TrailCard[]
  myRole: Role
  onCardTap?: (index: number) => void
  selectedIndices?: number[]
  activeIdx?: number | null
  guessAttempt?: { trailIndex: number; value: number }[]
}

export default function CardTrail({
  trail,
  myRole,
  onCardTap,
  selectedIndices = [],
  activeIdx = null,
  guessAttempt = [],
}: Props) {
  const trailRef = useRef<HTMLDivElement>(null)

  // 새 카드가 추가될 때마다 오른쪽 끝으로 스크롤
  useEffect(() => {
    if (trailRef.current) {
      trailRef.current.scrollLeft = trailRef.current.scrollWidth
    }
  }, [trail.length])

  return (
    <section className={styles.section}>
      <div className={styles.label}>카드 경로</div>
      <div className={styles.trail} ref={trailRef}>
        {trail.map((card, i) => {
          const isRevealed = card.face === 'revealed'
          const isSelected = selectedIndices.includes(i)
          const isActive = activeIdx === i
          const isGuessable = myRole === 'chaser' && !isRevealed && i > 0
          const assignedGuess = guessAttempt.find(g => g.trailIndex === i)

          return (
            <div
              key={i}
              className={[
                styles.card,
                isRevealed ? styles.revealed : styles.faceDown,
                isActive ? styles.active : isSelected ? styles.selected : '',
                isGuessable ? styles.guessable : '',
              ].join(' ')}
              onClick={() => isGuessable && onCardTap?.(i)}
            >
              {isRevealed && (
                <span className={styles.value}>{card.value}</span>
              )}
              {myRole === 'runner' && !isRevealed && (
                <span className={styles.secretValue}>{card.value}</span>
              )}
              {card.boosters && card.boosters.length > 0 && (
                <span className={styles.boosterBadge}>
                  {isRevealed
                    ? card.boosters.join(' ')
                    : `+${card.boosters.length}장`}
                </span>
              )}
              {/* 추리 배정 숫자: 추격자는 본인 입력값, 도망자는 상대 추리 현황 */}
              {!isRevealed && assignedGuess && (
                <span className={styles.guessBadge}>{assignedGuess.value}</span>
              )}
            </div>
          )
        })}
      </div>
      {myRole === 'chaser' && activeIdx !== null && (
        <div className={styles.activeHint}>
          카드 {activeIdx}번 선택 — 번호판에서 숫자를 고르세요
        </div>
      )}
    </section>
  )
}
