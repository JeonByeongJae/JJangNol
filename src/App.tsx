import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { GAMES } from './games/registry'

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

function PlaygroundHome() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <h1 style={{ color: 'var(--color-gold)', fontFamily: 'serif', marginBottom: 32 }}>짱하의 놀이터</h1>
      <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 400 }}>
        {GAMES.map(game => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              color: 'var(--color-text)',
            }}>
              <span style={{ fontSize: 32 }}>{game.emoji}</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>{game.name}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{game.players}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
