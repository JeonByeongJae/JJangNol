import { useState } from 'react'
import { createRoom, joinRoom } from '../firebase/roomDb'
import type { Role } from '../types/game'
import styles from './HomeScreen.module.css'

interface Props {
  onEnterRoom: (roomId: string, myRole: Role, name: string) => void
}

export default function HomeScreen({ onEnterRoom }: Props) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return setError('닉네임을 입력하세요')
    setLoading(true)
    try {
      const roomId = await createRoom(name.trim())
      onEnterRoom(roomId, 'runner', name.trim())
    } catch {
      setError('방 생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim()) return setError('닉네임을 입력하세요')
    if (!joinCode.trim()) return setError('방 코드를 입력하세요')
    setLoading(true)
    try {
      const code = joinCode.trim().toUpperCase()
      await joinRoom(code, name.trim())
      onEnterRoom(code, 'chaser', name.trim())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '방 참가에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>RUNNER</h1>
        <p className={styles.subtitle}>도망자</p>

        <input
          className={styles.input}
          placeholder="닉네임"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          maxLength={12}
        />

        <button className={styles.primaryBtn} onClick={handleCreate} disabled={loading}>
          방 만들기 (도망자)
        </button>

        <div className={styles.divider}>또는</div>

        <div className={styles.joinRow}>
          <input
            className={styles.codeInput}
            placeholder="방 코드"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
            maxLength={6}
          />
          <button className={styles.joinBtn} onClick={handleJoin} disabled={loading}>
            참가
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  )
}
