import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GAMES } from './games/registry'
import PlaygroundHome from './screens/PlaygroundHome'

export default function App() {
  return (
    <BrowserRouter basename="/JJangNol">
      <Suspense fallback={<div style={{ color: 'var(--color-text-muted)', padding: 24, textAlign: 'center' }}>로딩 중...</div>}>
        <Routes>
          <Route path="/" element={<PlaygroundHome />} />
          {GAMES.map(game => (
            <Route
              key={game.id}
              path={`/games/${game.id}/*`}
              element={<game.component />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
