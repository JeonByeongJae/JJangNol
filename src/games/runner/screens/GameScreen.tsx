import { useState, useCallback, useEffect, useRef } from 'react'
import type { GameRoom, Role, Pile } from '../types/game'
import { getPlayableCards } from '../utils/highlight'
import {
  drawCard,
  placeCard,
  endRunnerTurn,
  passTurn,
  toggleGuess,
  submitGuess,
  endChaserTurn,
  clearGuessAttempt,
} from '../firebase/roomDb'
import TurnBanner from '../components/TurnBanner'
import CardTrail from '../components/CardTrail'
import CardPiles from '../components/CardPiles'
import HandCards from '../components/HandCards'
import ChaserBoard from '../components/ChaserBoard'
import ActionPanel from '../components/ActionPanel'
import styles from './GameScreen.module.css'

interface Props {
  room: GameRoom
  roomId: string
  myRole: Role
}

export default function GameScreen({ room, roomId, myRole }: Props) {
  const [selectedBoosters, setSelectedBoosters] = useState<number[]>([])
  const [pendingCard, setPendingCard] = useState<number | null>(null)
  const [activeTrailIdx, setActiveTrailIdx] = useState<number | null>(null)
  const [guessResult, setGuessResult] = useState<'correct' | 'wrong' | null>(null)
  const guessResultTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevGuessResult = useRef(room.lastGuessResult)

  const isMyTurn = room.turn === myRole
  const canDraw = isMyTurn && room.phase === 'draw'
  const canAct = isMyTurn && room.phase === 'action'

  const lastTrailValue = room.trail[room.trail.length - 1]?.value ?? 0
  const maxPlace = room.turnNumber === 0 ? 2 : 1
  const canPlaceMore = canAct && myRole === 'runner' && room.cardsPlacedThisTurn < maxPlace

  const playableCards = canPlaceMore
    ? getPlayableCards(room.runnerHand, lastTrailValue, selectedBoosters)
    : []

  // Firebase lastGuessResult 변화 감지 → 양쪽 플레이어 모두 플래시
  useEffect(() => {
    if (room.lastGuessResult && room.lastGuessResult !== prevGuessResult.current) {
      if (guessResultTimer.current) clearTimeout(guessResultTimer.current)
      setGuessResult(room.lastGuessResult)
      guessResultTimer.current = setTimeout(() => setGuessResult(null), 2000)
    }
    prevGuessResult.current = room.lastGuessResult
  }, [room.lastGuessResult])

  // 턴이 바뀌면 로컬 UI 상태 초기화
  useEffect(() => {
    setPendingCard(null)
    setSelectedBoosters([])
    setActiveTrailIdx(null)
  }, [room.turn, room.turnNumber])

  const handleRunnerCardClick = useCallback(
    (card: number) => {
      if (!canPlaceMore || myRole !== 'runner') return

      // 이미 부스터 → 제거
      if (selectedBoosters.includes(card)) {
        setSelectedBoosters(prev => prev.filter(b => b !== card))
        return
      }

      // 현재 pendingCard를 다시 클릭 → 부스터로 전환 (범위 내 카드도 부스터로 사용 가능)
      if (card === pendingCard) {
        setSelectedBoosters(prev => [...prev, card])
        setPendingCard(null)
        return
      }

      // Playable 카드이고 pendingCard 없음 → pendingCard로
      if (playableCards.includes(card) && pendingCard === null) {
        setPendingCard(card)
        return
      }

      // 그 외 (non-playable, 또는 playable이지만 pendingCard 이미 있음) → 부스터로
      setSelectedBoosters(prev => [...prev, card])
    },
    [canPlaceMore, myRole, selectedBoosters, playableCards, pendingCard]
  )

  const handleConfirmPlace = async () => {
    if (pendingCard === null) return
    await placeCard(roomId, pendingCard, selectedBoosters)
    setPendingCard(null)
    setSelectedBoosters([])
    const newCount = room.cardsPlacedThisTurn + 1
    if (newCount >= maxPlace) {
      await endRunnerTurn(roomId)
    }
  }

  const handlePass = async () => {
    await passTurn(roomId)
    setPendingCard(null)
    setSelectedBoosters([])
  }

  const handleDraw = async (pile: Pile) => {
    await drawCard(roomId, pile)
  }

  const handleTrailTap = useCallback(
    (index: number) => {
      if (myRole !== 'chaser' || !canAct) return
      setActiveTrailIdx(prev => (prev === index ? null : index))
    },
    [myRole, canAct]
  )

  const handleBoardToggle = async (num: number) => {
    if (myRole !== 'chaser' || !canAct || activeTrailIdx === null) return
    await toggleGuess(roomId, activeTrailIdx, num)
    setActiveTrailIdx(null)
  }

  const handleSubmitGuess = async () => {
    await submitGuess(roomId)
    setActiveTrailIdx(null)
    // 플래시는 room.lastGuessResult useEffect에서 처리
  }

  const handleClearGuess = async () => {
    await clearGuessAttempt(roomId)
    setActiveTrailIdx(null)
  }

  const handleEndChaserTurn = async () => {
    await endChaserTurn(roomId)
    setActiveTrailIdx(null)
  }

  const guessSelectedIndices = room.guessAttempt.map(g => g.trailIndex)

  return (
    <div className={styles.screen}>
      <TurnBanner
        turn={room.turn}
        phase={room.phase}
        myRole={myRole}
        turnNumber={room.turnNumber}
        drawsRemaining={room.drawsRemaining}
        lastAction={room.lastAction}
      />

      {guessResult && (
        <div className={`${styles.guessResult} ${guessResult === 'correct' ? styles.guessCorrect : styles.guessWrong}`}>
          {guessResult === 'correct' ? '정답! 카드가 공개됩니다' : '틀렸습니다'}
        </div>
      )}

      <CardTrail
        trail={room.trail}
        myRole={myRole}
        onCardTap={handleTrailTap}
        selectedIndices={guessSelectedIndices}
        activeIdx={activeTrailIdx}
        guessAttempt={room.guessAttempt}
      />

      <CardPiles piles={room.piles} canDraw={canDraw} onDraw={handleDraw} />

      {myRole === 'runner' && (
        <HandCards
          hand={room.runnerHand}
          playableCards={playableCards}
          selectedBoosters={selectedBoosters}
          canPlay={canAct}
          onCardClick={handleRunnerCardClick}
        />
      )}

      {myRole === 'chaser' && (
        <>
          <div className={styles.runnerHandCount}>
            🏃 도망자 손패 {room.runnerHand.length}장
          </div>
          <ChaserBoard
            board={room.chaserBoard}
            onToggle={canAct && activeTrailIdx !== null ? handleBoardToggle : undefined}
          />
        </>
      )}

      <ActionPanel
        myRole={myRole}
        turn={room.turn}
        phase={room.phase}
        turnNumber={room.turnNumber}
        placedThisTurn={room.cardsPlacedThisTurn}
        selectedBoosters={selectedBoosters}
        pendingCard={pendingCard}
        onConfirmPlace={handleConfirmPlace}
        onPass={handlePass}
        onClearBoosters={() => setSelectedBoosters([])}
        guessCount={room.guessAttempt.length}
        onSubmitGuess={handleSubmitGuess}
        onEndChaserTurn={handleEndChaserTurn}
        onClearGuess={handleClearGuess}
      />
    </div>
  )
}
