import { useState, useEffect } from 'react'
import { subscribeRoom } from '../firebase/roomDb'
import type { GameRoom } from '../types/game'

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeRoom(roomId, data => {
      setRoom(data)
      setLoading(false)
    })
    return unsubscribe
  }, [roomId])

  return { room, loading }
}
