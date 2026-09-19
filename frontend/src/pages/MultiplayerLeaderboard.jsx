import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trophy, Filter, Medal, Gamepad2, TrendingUp, TrendingDown } from 'lucide-react'
import { getMultiplayerLeaderboard } from '../services/api'

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
}

export default function MultiplayerLeaderboard() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [campusFilter, setCampusFilter] = useState('ALL')
  const [currentPlayer, setCurrentPlayer] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('ganpati_player')
    if (stored) setCurrentPlayer(JSON.parse(stored))
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const data = await getMultiplayerLeaderboard()
      setPlayers(data.leaderboard || data || [])
    } catch (err) {
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const campuses = ['ALL', ...new Set(players.map((p) => p.campus).filter(Boolean))]
  const filteredPlayers = campusFilter === 'ALL' ? players : players.filter((p) => p.campus === campusFilter)

  const getMedal = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return null
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/multiplayer" style={{ textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                marginBottom: '1.5rem',
              }}
            >
              <ArrowLeft size={20} />
              <span style={{ fontSize: '0.9rem' }}>Back</span>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '0.5rem' }}>
            <Trophy size={28} style={{ color: 'var(--secondary)' }} />
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 800,
                color: 'var(--text)',
              }}
            >
              Multiplayer Rankings
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Top players by ELO rating
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Campus
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {campuses.map((c) => (
              <motion.button
                key={c}
                onClick={() => setCampusFilter(c)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: campusFilter === c ? 'var(--primary)' : 'var(--darker)',
                  background: campusFilter === c ? 'var(--primary)' : 'transparent',
                  color: campusFilter === c ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {c}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--darker)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
              }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading rankings...</p>
          </div>
        ) : error ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--danger)',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Gamepad2 size={48} style={{ color: 'var(--darker)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No players found</p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 100px 80px 80px',
                padding: '0.8rem 1rem',
                borderBottom: '1px solid var(--darker)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              <span>#</span>
              <span>Player</span>
              <span style={{ textAlign: 'center' }}>Rating</span>
              <span style={{ textAlign: 'center' }}>W</span>
              <span style={{ textAlign: 'center' }}>L</span>
            </div>

            <AnimatePresence>
              {filteredPlayers.map((p, i) => {
                const isMe = currentPlayer && p.player_id === currentPlayer.player_id
                const medal = getMedal(i)

                return (
                  <motion.div
                    key={p.player_id || i}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 100px 80px 80px',
                      padding: '0.7rem 1rem',
                      borderBottom: '1px solid var(--darker)',
                      background: isMe ? 'rgba(255, 107, 53, 0.08)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        color: medal ? 'var(--secondary)' : 'var(--text-muted)',
                        fontSize: medal ? '1.1rem' : '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {medal || i + 1}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-full)',
                          background: isMe ? 'var(--primary)' : 'var(--darker)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        {p.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: isMe ? 'var(--primary)' : 'var(--text)',
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.display_name}
                          {isMe && <span style={{ fontSize: '0.65rem', marginLeft: 6, opacity: 0.7 }}>(you)</span>}
                        </div>
                        {p.campus && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.campus}</div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: 'var(--secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      {p.rating_change > 0 && <TrendingUp size={12} style={{ color: 'var(--success)' }} />}
                      {p.rating_change < 0 && <TrendingDown size={12} style={{ color: 'var(--danger)' }} />}
                      {p.rating}
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.wins ?? 0}
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.losses ?? 0}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
