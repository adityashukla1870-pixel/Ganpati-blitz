import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Home, RefreshCw, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getSocket } from '../services/socket'

const confettiColors = ['#FF6B35', '#FFD700', '#1B998B', '#FF4444', '#4CAF50']

function ConfettiPiece({ delay, color }) {
  const x = Math.random() * 100
  const rotation = Math.random() * 360
  const duration = 2 + Math.random() * 2

  return (
    <motion.div
      initial={{ y: -20, x: `${x}vw`, rotate: 0, opacity: 1 }}
      animate={{
        y: '100vh',
        rotate: rotation + 720,
        opacity: [1, 1, 0],
      }}
      transition={{ delay, duration, ease: 'easeIn', repeat: Infinity, repeatDelay: 1 }}
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
        background: color,
        pointerEvents: 'none',
      }}
    />
  )
}

export default function MatchResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const result = location.state || {}

  const [waitingRematch, setWaitingRematch] = useState(false)
  const [player, setPlayer] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('ganpati_player')
    if (stored) setPlayer(JSON.parse(stored))

    if (!result.match_id) {
      navigate('/multiplayer')
    }
  }, [result.match_id, navigate])

  useEffect(() => {
    const socket = getSocket()

    const onRematchStart = (data) => {
      setWaitingRematch(false)
      navigate('/multiplayer/game', {
        state: {
          room_code: data.room_code,
          seed: data.seed,
          match_id: data.match_id,
          opponent: data.opponent,
        },
      })
    }

    const onRematchDeclined = () => {
      setWaitingRematch(false)
    }

    socket.on('rematch_start', onRematchStart)
    socket.on('rematch_declined', onRematchDeclined)

    return () => {
      socket.off('rematch_start', onRematchStart)
      socket.off('rematch_declined', onRematchDeclined)
    }
  }, [navigate])

  const handleRematch = useCallback(() => {
    setWaitingRematch(true)
    const socket = getSocket()
    const stored = JSON.parse(localStorage.getItem('ganpati_player'))
    socket.emit('rematch_requested', {
      match_id: result.match_id,
      player_id: stored?.player_id,
    })
  }, [result.match_id])

  const isWin = result.result === 'win'
  const isDraw = result.result === 'draw'
  const ratingChange = result.rating_change || 0

  if (!result.match_id) return null

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', position: 'relative', overflow: 'hidden' }}>
      {isWin && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiPiece
              key={i}
              delay={i * 0.1}
              color={confettiColors[i % confettiColors.length]}
            />
          ))}
        </div>
      )}

      <div
        style={{
          maxWidth: 500,
          margin: '0 auto',
          padding: '2rem 1rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <motion.div
            animate={isWin ? { rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: isWin ? Infinity : 0, repeatDelay: 2 }}
            style={{
              fontSize: '5rem',
              lineHeight: 1,
              marginBottom: '0.5rem',
            }}
          >
            {isWin ? '🏆' : isDraw ? '🤝' : '💪'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
              fontWeight: 900,
              background: isWin
                ? 'linear-gradient(135deg, var(--secondary), #ffe066)'
                : isDraw
                ? 'linear-gradient(135deg, var(--text), var(--text-muted))'
                : 'linear-gradient(135deg, var(--text), var(--text-muted))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
            }}
          >
            {isWin ? 'YOU WIN!' : isDraw ? 'DRAW' : 'GOOD GAME'}
          </motion.h1>

          {!isDraw && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {isWin ? 'Outstanding performance!' : 'Better luck next time!'}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: '0.3rem',
                }}
              >
                YOU
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: isWin ? 'var(--success)' : isDraw ? 'var(--text)' : 'var(--text)',
                }}
              >
                {result.my_score ?? 0}
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 50,
                background: 'var(--darker)',
              }}
            />

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: '0.3rem',
                }}
              >
                {result.opponent_name || 'OPPONENT'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: !isWin && !isDraw ? 'var(--danger)' : 'var(--text)',
                }}
              >
                {result.opponent_score ?? 0}
              </div>
            </div>
          </div>
        </motion.div>

        {ratingChange !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {ratingChange > 0 ? (
              <TrendingUp size={20} style={{ color: 'var(--success)' }} />
            ) : ratingChange < 0 ? (
              <TrendingDown size={20} style={{ color: 'var(--danger)' }} />
            ) : (
              <Minus size={20} style={{ color: 'var(--text-muted)' }} />
            )}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating: </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: ratingChange > 0 ? 'var(--success)' : ratingChange < 0 ? 'var(--danger)' : 'var(--text-muted)',
                }}
              >
                {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
              </span>
            </div>
          </motion.div>
        )}

        {/* Universal Points Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 107, 53, 0.15))',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3rem' }}>👑</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase' }}>
              Universal Points
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.25rem', color: '#FFF' }}>
            +{result.universal_points_awarded ?? (isWin ? 55 : isDraw ? 35 : 20)} <span style={{ fontSize: '0.75rem', color: '#FFD700' }}>UP</span>
          </div>
        </motion.div>

        {waitingRematch ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1rem',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ marginBottom: '1rem', display: 'inline-block' }}
            >
              <RefreshCw size={28} style={{ color: 'var(--primary)' }} />
            </motion.div>
            <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem' }}>
              Waiting for opponent...
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              They may have left the game
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <motion.button
              onClick={handleRematch}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--primary)',
                background: 'transparent',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={18} />
              REMATCH
            </motion.button>

            <Link to="/" style={{ flex: 1, textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Home size={18} />
                HOME
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
