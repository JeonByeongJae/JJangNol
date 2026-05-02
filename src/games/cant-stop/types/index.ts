export type PlayerKey = 'host' | 'guest'

export interface CantStopPlayer {
  name: string
}

export interface ColumnState {
  host: number    // 확정 캠프 위치 (0 = 없음)
  guest: number
  locked: PlayerKey | null  // 점령한 플레이어, null = 미점령
}

export interface CantStopRoomState {
  status: 'waiting' | 'playing' | 'finished'
  players: {
    host?: CantStopPlayer
    guest?: CantStopPlayer
  }
  turn: PlayerKey | null
  board: Record<string, ColumnState>   // "2" ~ "12"
  climbers: Record<string, number>     // "2" ~ "12", 임시 등반자 위치
  dice: number[]                       // 굴린 주사위 4개
  rolledThisTurn: boolean
  winner: PlayerKey | null
  pendingCombo?: [number, number] | null  // 현재 턴 플레이어가 선택 중인 콤보
}

export interface Session {
  roomId: string
  myKey: PlayerKey
  myName: string
}
