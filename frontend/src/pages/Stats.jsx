import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Flame, Gamepad2, Trophy } from 'lucide-react'
import { getStats } from '../services/api'
import { getPlayer } from '../utils/storage'

export default function Stats() {
  const player = getPlayer()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!player?.player_id) return
    getStats(player.player_id).then(setStats).catch(() => setError('Statistics temporarily unavailable'))
  }, [player?.player_id])

  if (!player) return <main style={styles.center}>Set up your player profile first.</main>
  if (error) return <main style={styles.center}>{error}</main>
  if (!stats) return <main style={styles.center}>Loading statistics...</main>
  const mostPlayed = stats.games[0]
  return <main style={styles.page}>
    <Link to="/profile" style={styles.back}><ArrowLeft size={17} /> Profile</Link>
    <h1>📊 Player Statistics</h1>
    <p style={styles.muted}>Your actual arcade activity, recorded from completed runs.</p>
    <div style={styles.grid}>
      <Stat icon={<Gamepad2 size={18} />} label="Completed Games" value={stats.games.reduce((total, item) => total + item.plays, 0)} />
      <Stat icon={<Trophy size={18} />} label="Total XP" value={stats.progression.total_xp} />
      <Stat icon={<Flame size={18} />} label="Current Streak" value={`${stats.current_streak} days`} />
      <Stat icon={<Flame size={18} />} label="Longest Streak" value={`${stats.longest_streak} days`} />
      <Stat icon={<Gamepad2 size={18} />} label="Daily Challenges" value={stats.daily_challenges_completed} />
      <Stat icon={<Trophy size={18} />} label="Blitz Mix Runs" value={stats.blitz_mix_completions} />
    </div>
    <section className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
      <h2 style={{ fontSize: '1.05rem', margin: '0 0 1rem' }}>Games</h2>
      {stats.games.length === 0 ? <p style={styles.muted}>You haven't played this game yet.</p> : stats.games.map((game) => <div key={game._id} style={styles.row}><span>{game._id.replace(/-/g, ' ')}</span><span>{game.plays} plays · best {game.best_score}</span></div>)}
      {mostPlayed && <p style={{ ...styles.muted, marginBottom: 0 }}>Most played: <strong>{mostPlayed._id.replace(/-/g, ' ')}</strong></p>}
    </section>
  </main>
}

function Stat({ icon, label, value }) {
  return <div className="card" style={{ padding: '1rem' }}><div style={{ color: 'var(--secondary)', marginBottom: 8 }}>{icon}</div><strong style={{ fontSize: '1.2rem' }}>{value}</strong><div style={{ ...styles.muted, fontSize: '0.75rem' }}>{label}</div></div>
}

const styles = {
  page: { minHeight: 'calc(100vh - 88px)', maxWidth: 820, margin: '0 auto', padding: '2rem 1rem 4rem' },
  center: { minHeight: 'calc(100vh - 88px)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem' },
  muted: { color: 'var(--text-muted)', lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' },
  row: { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'capitalize' },
}