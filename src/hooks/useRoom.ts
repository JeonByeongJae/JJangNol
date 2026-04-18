import { useState, useEffect } from 'react'
import { subscribeRoom } from '../firebase/roomDb'
import type { GameRoom, Role } from '../types/game'

export function useRoom(roomId: string | null, role: Role | null) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId || !role) {
      setRoom(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeRoom(roomId, data => {
      setRoom(data)
      setLoading(false)
    }, role)
    return unsubscribe
  }, [roomId, role])

  return { room, loading }
}
