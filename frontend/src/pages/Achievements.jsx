import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, Medal } from 'lucide-react'
import { getPlayerAchievements } from '../services/api'
import { getPlayer } from '../utils/storage'

export default function Achievements() {
  const player = getPlayer()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!player?.player_id) return
    getPlayerAchievements(player.player_id).then(setData).catch(() => setError('Achievements temporarily unavailable'))
  }, [player?.player_id])

  if (!player) return <main style={styles.center}>Set up your player profile first.</main>
  if (error) return <main style={styles.center}>{error}</main>
  if (!data) return <main style={styles.center}>Loading achievements...</main>
  const unlocked = new Set(data.unlocked.map((item) => item.achievement_id))

  return <main style={styles.page}>
    <Link to="/games" style={styles.back}><ArrowLeft size={17} /> Arcade</Link>
    <h1 style={{ margin: '0 0 0.4rem' }}>🏆 Achievements</h1>
    <p style={styles.muted}>{unlocked.size}/{data.achievements.length} unlocked</p>
    <div style={styles.grid}>{data.achievements.map((achievement) => {
      const isUnlocked = unlocked.has(achievement.id)
      return <article key={achievement.id} className="card" style={{ ...styles.card, opacity: isUnlocked ? 1 : 0.65 }}>
        <div style={{ ...styles.badge, color: isUnlocked ? 'var(--secondary)' : 'var(--text-muted)' }}>{isUnlocked ? <Medal size={25} /> : <Lock size={22} />}</div>
        <h2 style={styles.title}>{achievement.name}</h2>
        <p style={styles.muted}>{achievement.description}</p>
        <strong style={{ color: isUnlocked ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.72rem' }}>{isUnlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
      </article>
    })}</div>
  </main>
}

const styles = {
  page: { minHeight: 'calc(100vh - 88px)', maxWidth: 820, margin: '0 auto', padding: '2rem 1rem 4rem' },
  center: { minHeight: 'calc(100vh - 88px)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem', marginTop: '1.5rem' },
  card: { padding: '1.15rem' },
  badge: { width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'rgba(255,215,0,0.1)', marginBottom: '0.8rem' },
  title: { fontSize: '1rem', margin: '0 0 0.35rem' },
  muted: { color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.45 },
}