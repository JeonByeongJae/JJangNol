import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import type { CantStopRoomState, PlayerKey } from './types'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import ResultScreen from './screens/ResultScreen'
import { subscribeRoom } from '../../shared/firebase/cantStopDb'
import { useRoom } from '../../shared/hooks/useRoom'

function CantStopRoom() {
  const { roomId, role } = useParams<{ roomId: string; role: string }>()
  const navigate = useNavigate()
  const myKey = role as PlayerKey

  const { room, loading } = useRoom<CantStopRoomState>(roomId ?? null, subscribeRoom)

  const handlePlayAgain = () => navigate('/games/cant-stop')

  if (loading || !room) {
    return <div style={{ color: '#a08060', padding: 24, textAlign: 'center' }}>연결 중...</div>
  }

  if (room.status === 'finished' && room.winner) {
    return <ResultScreen room={room} myKey={myKey} onPlayAgain={handlePlayAgain} />
  }

  if (room.status === 'playing') {
    return <GameScreen roomId={roomId!} myKey={myKey} />
  }

  return <LobbyScreen room={room} roomId={roomId!} />
}

export default function CantStopApp() {
  const navigate = useNavigate()

  const handleEnterRoom = (roomId: string, myKey: PlayerKey) => {
    navigate(`room/${roomId}/${myKey}`)
  }

  return (
    <Routes>
      <Route path="/" element={<HomeScreen onEnterRoom={handleEnterRoom} />} />
      <Route path="room/:roomId/:role" element={<CantStopRoom />} />
    </Routes>
  )
}
