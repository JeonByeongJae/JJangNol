import { Link } from 'react-router-dom'
import { GAMES } from '../../games/registry'
import styles from './index.module.css'

export default function PlaygroundHome() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>짱하의 놀이터</h1>
      <div className={styles.grid}>
        {GAMES.map(game => (
          <Link key={game.id} to={`/games/${game.id}`} className={styles.card}>
            <span className={styles.emoji}>{game.emoji}</span>
            <div>
              <div className={styles.gameName}>{game.name}</div>
              <div className={styles.players}>{game.players}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
