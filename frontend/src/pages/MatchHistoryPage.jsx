import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Gamepad2, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { getMatchHistory } from '../services/api'

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function MatchHistoryPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [player, setPlayer] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('ganpati_player')
    if (stored) {
      const p = JSON.parse(stored)
      setPlayer(p)
      fetchHistory(p.player_id)
    } else {
      setLoading(false)
      setError('Please log in to view match history')
    }
  }, [])

  const fetchHistory = async (playerId) => {
    setLoading(true)
    try {
      const data = await getMatchHistory(playerId)
      setMatches(data.matches || data || [])
    } catch (err) {
      setError('Failed to load match history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getResultStyle = (result) => {
    switch (result) {
      case 'win':
        return { text: 'WIN', color: 'var(--success)', bg: 'rgba(76, 175, 80, 0.1)' }
      case 'loss':
        return { text: 'LOSS', color: 'var(--danger)', bg: 'rgba(255, 68, 68, 0.1)' }
      case 'draw':
        return { text: 'DRAW', color: 'var(--text-muted)', bg: 'var(--darker)' }
      default:
        return { text: result?.toUpperCase() || '?', color: 'var(--text-muted)', bg: 'var(--darker)' }
    }
  }

  const getResultIcon = (result) => {
    switch (result) {
      case 'win':
        return <TrendingUp size={14} />
      case 'loss':
        return <TrendingDown size={14} />
      default:
        return <Minus size={14} />
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
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
            <Gamepad2 size={28} style={{ color: 'var(--accent)' }} />
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 800,
                color: 'var(--text)',
              }}
            >
              Match History
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your recent multiplayer matches</p>
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
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
              }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading matches...</p>
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
        ) : matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
            <h3 style={{ color: 'var(--text)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No matches yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Start playing multiplayer to see your history here
            </p>
            <Link to="/multiplayer" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.7rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Start Playing
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
            }}
          >
            {matches.map((match, i) => {
              const rs = getResultStyle(match.result)

              return (
                <motion.div
                  key={match.match_id || i}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    padding: '0.9rem 1rem',
                    borderBottom: i < matches.length - 1 ? '1px solid var(--darker)' : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-full)',
                          background: rs.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        {getResultIcon(match.result)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--text)',
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          vs {match.opponent_name || 'Unknown'}
                        </div>
                        {match.date && (
                          <div
                            style={{
                              fontSize: '0.65rem',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Calendar size={10} />
                            {formatDate(match.date)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ color: 'var(--success)' }}>{match.my_score ?? 0}</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>-</span>
                          <span style={{ color: 'var(--danger)' }}>{match.opponent_score ?? 0}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: rs.bg,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          color: rs.color,
                          letterSpacing: 1,
                        }}
                      >
                        {rs.text}
                      </div>

                      {match.rating_change !== undefined && match.rating_change !== 0 && (
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: match.rating_change > 0 ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          {match.rating_change > 0 ? '+' : ''}{match.rating_change}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
