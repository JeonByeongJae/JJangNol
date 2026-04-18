import { useState } from 'react'
import { useRoom } from './hooks/useRoom'
import type { Role } from './types/game'
import { rematchRoom } from './firebase/roomDb'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import ResultScreen from './screens/ResultScreen'

interface Session {
  roomId: string
  myRole: Role
  myName: string
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const { room, loading } = useRoom(session?.roomId ?? null)

  const handleEnterRoom = (roomId: string, myRole: Role, myName: string) => {
    setSession({ roomId, myRole, myName })
  }

  const handlePlayAgain = () => {
    setSession(null)
  }

  const handleRematch = async (swapRoles = false) => {
    if (!session) return
    await rematchRoom(session.roomId, swapRoles)
    if (swapRoles) {
      setSession(prev => prev ? { ...prev, myRole: prev.myRole === 'runner' ? 'chaser' : 'runner' } : null)
    }
  }

  if (!session) {
    return <HomeScreen onEnterRoom={handleEnterRoom} />
  }

  if (loading || !room) {
    return (
      <div style={{ color: 'var(--color-text-muted)', padding: 24, textAlign: 'center' }}>
        연결 중...
      </div>
    )
  }

  if (room.status === 'finished' && room.winner) {
    return (
      <ResultScreen
        winner={room.winner}
        myRole={session.myRole}
        runnerName={room.players.runner?.name ?? '도망자'}
        chaserName={room.players.chaser?.name ?? '추격자'}
        trail={room.trail}
        onPlayAgain={handlePlayAgain}
        onRematch={() => handleRematch(false)}
        onRematchSwap={() => handleRematch(true)}
      />
    )
  }

  if (room.status === 'playing') {
    return (
      <GameScreen
        room={room}
        roomId={session.roomId}
        myRole={session.myRole}
      />
    )
  }

  // status === 'waiting'
  return (
    <LobbyScreen
      room={room}
      roomId={session.roomId}
      myRole={session.myRole}
    />
  )
}
