import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Gamepad2, Trophy, User } from 'lucide-react'
import { getProfile } from '../services/api'
import { getPlayer } from '../utils/storage'

export default function Profile() {
  const player = getPlayer()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!player?.player_id) return
    getProfile(player.player_id).then(setProfile).catch(() => setError('Profile temporarily unavailable'))
  }, [player?.player_id])

  if (!player) {
    return <EmptyProfile message="Set up your player profile to track progression." />
  }

  if (error) return <EmptyProfile message={error} />
  if (!profile) return <EmptyProfile message="Loading profile..." />

  const { progression, stats, best_scores: bestScores } = profile
  const progressPercent = Math.min(100, Math.round((progression.progress_xp / progression.progress_required) * 100))

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '2rem 1rem 4rem' }}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 820, margin: '0 auto' }}>
        <Link to="/games" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: '1.5rem' }}>
          <ArrowLeft size={17} /> Arcade
        </Link>
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ width: 56, height: 56, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'rgba(255,107,53,0.15)', color: 'var(--primary)' }}><User size={28} /></div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{profile.player.display_name}</h1>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>{profile.player.campus}</p>
            </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}><strong style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>LEVEL {progression.level}</strong><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>🔥 {progression.current_streak || 0} day streak</div></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>
            <span>{progression.total_xp} total XP</span><span>{progression.progress_xp} / {progression.progress_required} XP to next level</span>
          </div>
          <div aria-label={`${progressPercent}% progress to next level`} style={{ height: 10, background: 'var(--darker)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <Stat icon={<Gamepad2 size={18} />} label="Games Played" value={stats.games_played} />
          <Stat icon={<Trophy size={18} />} label="Multiplayer Wins" value={stats.wins} />
          <Stat icon={<Award size={18} />} label="Achievements" value={`${stats.achievements}/${stats.achievement_total}`} />
          <Stat icon={<Trophy size={18} />} label="Rating" value={profile.player.rating} />
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', margin: '0 0 1rem' }}>Best Scores</h2>
          {Object.keys(bestScores).length === 0 ? <p style={{ color: 'var(--text-muted)', margin: 0 }}>You haven't played a game yet.</p> : Object.entries(bestScores).map(([gameId, score]) => (
            <div key={gameId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{gameId.replace(/-/g, ' ')}</span><strong>{score.toLocaleString()}</strong>
            </div>
          ))}
        </div>
        <Link to="/stats" style={{ display: 'block', marginTop: '1rem', textAlign: 'center', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 700 }}>VIEW FULL STATISTICS</Link>
      </motion.div>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return <div className="card" style={{ padding: '1rem' }}><div style={{ color: 'var(--secondary)', marginBottom: 8 }}>{icon}</div><div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{value}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div></div>
}

function EmptyProfile({ message }) {
  return <div style={{ minHeight: 'calc(100vh - 88px)', display: 'grid', placeItems: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{message}</div>
}