import { lazy } from 'react'
import type { ComponentType } from 'react'

export interface GameEntry {
  id: string
  name: string
  emoji: string
  players: string
  component: ComponentType
}

export const GAMES: GameEntry[] = [
  {
    id: 'runner',
    name: '도망자',
    emoji: '🎲',
    players: '1대1',
    component: lazy(() => import('./runner/RunnerApp')),
  },
]
