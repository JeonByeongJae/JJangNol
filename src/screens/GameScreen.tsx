import { useState, useCallback } from 'react'
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
  const [placedThisTurn, setPlacedThisTurn] = useState(0)
  const [activeTrailIdx, setActiveTrailIdx] = useState<number | null>(null)

  const isMyTurn = room.turn === myRole
  const canDraw = isMyTurn && room.phase === 'draw'
  const canAct = isMyTurn && room.phase === 'action'

  const lastTrailValue = room.trail[room.trail.length - 1]?.value ?? 0

  const playableCards =
    canAct && myRole === 'runner'
      ? getPlayableCards(room.runnerHand, lastTrailValue, selectedBoosters)
      : []

  const handleRunnerCardClick = useCallback(
    (card: number) => {
      if (!canAct || myRole !== 'runner') return

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
    setPlacedThisTurn(prev => prev + 1)
    setPendingCard(null)
    setSelectedBoosters([])
  }

  const handlePass = async () => {
    await passTurn(roomId)
    setPlacedThisTurn(0)
    setPendingCard(null)
    setSelectedBoosters([])
  }

  const handleEndRunnerTurn = async () => {
    await endRunnerTurn(roomId)
    setPlacedThisTurn(0)
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
  }

  const handleSubmitGuess = async () => {
    await submitGuess(roomId)
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

      <CardTrail
        trail={room.trail}
        myRole={myRole}
        onCardTap={handleTrailTap}
        selectedIndices={guessSelectedIndices}
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
          onToggle={canAct ? handleBoardToggle : undefined}
        />
      )}

      <ActionPanel
        myRole={myRole}
        turn={room.turn}
        phase={room.phase}
        turnNumber={room.turnNumber}
        placedThisTurn={placedThisTurn}
        selectedBoosters={selectedBoosters}
        pendingCard={pendingCard}
        onConfirmPlace={handleConfirmPlace}
        onPass={handlePass}
        onEndTurn={handleEndRunnerTurn}
        onClearBoosters={() => setSelectedBoosters([])}
        guessCount={room.guessAttempt.length}
        onSubmitGuess={handleSubmitGuess}
        onEndChaserTurn={handleEndChaserTurn}
      />
    </div>
  )
}
