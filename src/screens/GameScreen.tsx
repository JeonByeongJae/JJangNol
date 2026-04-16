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

  const isMyTurn = room.turn === myRole
  const canDraw = isMyTurn && room.phase === 'draw'
  const canAct = isMyTurn && room.phase === 'action'

  const lastTrailValue = room.trail[room.trail.length - 1]?.value ?? 0
  const maxPlace = room.turnNumber === 0 ? 2 : 1
  const canPlaceMore = canAct && myRole === 'runner' && room.cardsPlacedThisTurn < maxPlace

  const playableCards = canPlaceMore
    ? getPlayableCards(room.runnerHand, lastTrailValue, selectedBoosters)
    : []

  // 턴이 바뀌면 로컬 UI 상태 초기화
  useEffect(() => {
    setPendingCard(null)
    setSelectedBoosters([])
    setActiveTrailIdx(null)
  }, [room.turn, room.turnNumber])

  const handleRunnerCardClick = useCallback(
    (card: number) => {
      if (!canPlaceMore || myRole !== 'runner') return

      if (selectedBoosters.includes(card)) {
        setSelectedBoosters(prev => prev.filter(b => b !== card))
        if (pendingCard === card) setPendingCard(null)
        return
      }

      if (playableCards.includes(card)) {
        setPendingCard(card)
        return
      }

      // 범위 밖 카드 → 부스터로 추가
      setSelectedBoosters(prev => [...prev, card])
    },
    [canAct, myRole, selectedBoosters, playableCards, pendingCard]
  )

  const handleConfirmPlace = async () => {
    if (pendingCard === null) return
    await placeCard(roomId, pendingCard, selectedBoosters)
    setPendingCard(null)
    setSelectedBoosters([])
    // 최대 배치 수에 도달하면 자동 턴 종료 (게임 종료 시 App.tsx가 ResultScreen으로 전환)
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
    // 번호 배정 후 activeTrailIdx 해제 (다음 카드 선택 유도)
    setActiveTrailIdx(null)
  }

  const handleSubmitGuess = async () => {
    const correct = await submitGuess(roomId)
    setActiveTrailIdx(null)

    if (guessResultTimer.current) clearTimeout(guessResultTimer.current)
    setGuessResult(correct ? 'correct' : 'wrong')
    guessResultTimer.current = setTimeout(() => setGuessResult(null), 2000)
    // submitGuess 내부에서 턴 종료까지 처리됨
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
        <ChaserBoard
          board={room.chaserBoard}
          onToggle={canAct && activeTrailIdx !== null ? handleBoardToggle : undefined}
        />
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
