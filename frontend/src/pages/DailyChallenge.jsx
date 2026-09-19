import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarCheck, Check, Play, Sparkles } from 'lucide-react'
import { completeDailyChallenge, getDailyChallenge } from '../services/api'
import { getPlayer } from '../utils/storage'

export default function DailyChallenge() {
  const player = getPlayer()
  const playerId = player?.player_id || player?.id
  const [data, setData] = useState(null)
  const [message, setMessage] = useState('')

  const load = () => playerId && getDailyChallenge(playerId).then(setData).catch(() => setMessage('Daily challenge unavailable'))
  useEffect(load, [playerId])

  const claim = async () => {
    try {
      const result = await completeDailyChallenge(playerId)
      setMessage(result.already_claimed ? 'Already claimed today.' : `+${result.rewarded_xp} XP awarded`)
      load()
    } catch (error) {
      setMessage(error.response?.data?.error || 'Complete the challenge first.')
    }
  }

  if (!player) {
    return (
      <main style={styles.page}>
        <Link to="/games" style={styles.back}><ArrowLeft size={17} /> Arcade</Link>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card" style={styles.card}>
          <div style={styles.icon}><CalendarCheck size={28} /></div>
          <p style={styles.eyebrow}>DAILY CHALLENGE</p>
          <h2 style={{ margin: '0.5rem 0', fontFamily: 'var(--font-display)' }}>Profile Required</h2>
          <p style={styles.muted}>Set up your player profile to unlock and track daily festival challenges, earn XP, and climb the leaderboard.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/player" style={styles.button}>
              Set Up Profile
            </Link>
          </div>
        </motion.section>
      </main>
    )
  }
  if (!data) {
    return (
      <main style={styles.page}>
        <Link to="/games" style={styles.back}><ArrowLeft size={17} /> Arcade</Link>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card" style={styles.card}>
          <div style={styles.icon}><CalendarCheck size={28} /></div>
          <p style={styles.eyebrow}>DAILY CHALLENGE</p>
          <h2 style={{ margin: '0.5rem 0', fontFamily: 'var(--font-display)' }}>
            {message ? 'Challenge Offline' : 'Loading Challenge...'}
          </h2>
          <p style={styles.muted}>
            {message || 'Fetching today\'s festive challenge and rewards...'}
          </p>
          {message && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={load} style={styles.button}>
                Retry
              </button>
              <Link to="/games" style={styles.claim}>
                Back to Arcade
              </Link>
            </div>
          )}
        </motion.section>
      </main>
    )
  }
  const { challenge } = data
  return (
    <main style={styles.page}>
      <Link to="/games" style={styles.back}><ArrowLeft size={17} /> Arcade</Link>
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card" style={styles.card}>
        <div style={styles.icon}><CalendarCheck size={28} /></div>
        <p style={styles.eyebrow}>TODAY'S CHALLENGE</p>
        <h1 style={{ margin: 0 }}>{challenge.game_id === 'modak-rush' ? '🍬 MODAK RUSH' : challenge.game_id}</h1>
        <p style={styles.muted}>{challenge.description}</p>
        <div style={styles.reward}><Sparkles size={17} /> Reward: +{challenge.reward_xp} XP</div>
        {data.completed ? <div style={styles.complete}><Check size={18} /> Challenge complete</div> : <>
          <Link to={challenge.game_id === 'modak-rush' ? '/game/modak-rush' : `/game/${challenge.game_id}`} style={styles.button}><Play size={17} /> PLAY CHALLENGE</Link>
          <button onClick={claim} style={styles.claim}>CLAIM REWARD</button>
        </>}
        {message && <p style={styles.muted}>{message}</p>}
      </motion.section>
    </main>
  )
}

const styles = {
  page: { minHeight: 'calc(100vh - 88px)', maxWidth: 560, margin: '0 auto', padding: '2rem 1rem' },
  center: { minHeight: 'calc(100vh - 88px)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem' },
  card: { padding: '2rem', textAlign: 'center' },
  icon: { width: 60, height: 60, display: 'grid', placeItems: 'center', margin: '0 auto 1rem', borderRadius: '50%', color: 'var(--secondary)', background: 'rgba(255,215,0,0.12)' },
  eyebrow: { color: 'var(--secondary)', fontSize: '0.75rem', letterSpacing: 2, fontWeight: 800 },
  muted: { color: 'var(--text-muted)', lineHeight: 1.5 },
  reward: { display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--secondary)', margin: '0.75rem 0 1.25rem' },
  button: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '0.9rem', color: '#fff', background: 'var(--primary)', borderRadius: 'var(--radius-lg)', textDecoration: 'none', fontWeight: 800 },
  claim: { marginTop: '0.75rem', padding: '0.7rem 1.2rem', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--text-muted)', borderRadius: 'var(--radius-md)', cursor: 'pointer' },
  complete: { display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--success)', fontWeight: 800 },
}