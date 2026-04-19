import { useState } from 'react'
import type { Session, PlayerKey, CantStopRoomState } from './types'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import ResultScreen from './screens/ResultScreen'
import { subscribeRoom } from '../../shared/firebase/cantStopDb'
import { useRoom } from '../../shared/hooks/useRoom'

export default function CantStopApp() {
  const [session, setSession] = useState<Session | null>(null)
  const { room, loading } = useRoom<CantStopRoomState>(
    session?.roomId ?? null,
    subscribeRoom
  )

  const handleEnterRoom = (roomId: string, myKey: PlayerKey, myName: string) => {
    setSession({ roomId, myKey, myName })
  }

  const handlePlayAgain = () => setSession(null)

  if (!session) {
    return <HomeScreen onEnterRoom={handleEnterRoom} />
  }

  if (loading || !room) {
    return <div style={{ color: '#a08060', padding: 24, textAlign: 'center' }}>연결 중...</div>
  }

  if (room.status === 'finished' && room.winner) {
    return (
      <ResultScreen
        room={room}
        myKey={session.myKey}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  if (room.status === 'playing') {
    return <GameScreen roomId={session.roomId} myKey={session.myKey} />
  }

  return <LobbyScreen room={room} roomId={session.roomId} />
}
