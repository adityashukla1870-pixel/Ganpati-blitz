import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, X, Loader2, Users, Zap } from 'lucide-react'
import { getSocket, connectSocket } from '../services/socket'

const QUEUE_TIMEOUT = 30

export default function QuickMatchPage() {
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [searching, setSearching] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('ganpati_player')
    if (stored) {
      setPlayer(JSON.parse(stored))
    } else {
      setError('Please set up your profile first')
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!player) return

    const socket = connectSocket()

    const onConnect = () => {
      socket.emit('join_quick_match', {
        player_id: player.player_id,
        display_name: player.display_name,
        campus: player.campus,
        rating: player.rating,
      })
    }

    const onMatchFound = (data) => {
      clearInterval(timerRef.current)
      setSearching(false)
      navigate('/multiplayer/waiting', {
        state: {
          room_code: data.room_code,
        },
      })
    }

    const onMatchError = (data) => {
      setSearching(false)
      setError(data.message || 'Failed to find a match')
    }

    socket.on('connect', onConnect)
    socket.on('match_found', onMatchFound)
    socket.on('error', onMatchError)

    if (socket.connected) {
      socket.emit('join_quick_match', {
        player_id: player.player_id,
        display_name: player.display_name,
        campus: player.campus,
        rating: player.rating,
      })
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('match_found', onMatchFound)
      socket.off('error', onMatchError)
    }
  }, [player, navigate])

  useEffect(() => {
    if (!searching) {
      clearInterval(timerRef.current)
      return
    }

    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(elapsedSec)

      if (elapsedSec >= QUEUE_TIMEOUT) {
        clearInterval(timerRef.current)
        setSearching(false)
        setError('No opponent found. Try again.')
        const socket = getSocket()
        socket.emit('cancel_quick_match', {
          player_id: player?.player_id,
        })
      }
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [searching, player])

  const handleCancel = useCallback(() => {
    const socket = getSocket()
    socket.emit('cancel_quick_match', {
      player_id: player?.player_id,
    })
    clearInterval(timerRef.current)
    setSearching(false)
    navigate('/multiplayer')
  }, [player, navigate])

  const handleRetry = () => {
    setError('')
    setElapsed(0)
    setSearching(true)
    startTimeRef.current = Date.now()

    const socket = connectSocket()
    if (player) {
      socket.emit('join_quick_match', {
        player_id: player.player_id,
        display_name: player.display_name,
        campus: player.campus,
        rating: player.rating,
      })
    }
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '2rem 1rem' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <Link to="/multiplayer" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={20} />
                <span style={{ fontSize: '0.9rem' }}>Back</span>
              </div>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            background: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            padding: '3rem 2rem',
          }}
        >
          {searching ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{ marginBottom: '1.5rem', display: 'inline-block' }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={36} color="#fff" />
                </div>
              </motion.div>

              <h2
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  marginBottom: '0.5rem',
                }}
              >
                寻找对手...
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Looking for an opponent
              </p>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--secondary)',
                  marginBottom: '2rem',
                }}
              >
                {formatTime(elapsed)}
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', justifyContent: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary)',
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0.6rem 1rem',
                  background: 'var(--darker)',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '1.5rem',
                }}
              >
                <Users size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Waiting for players to join...
                </span>
              </div>

              <motion.button
                onClick={handleCancel}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.8rem 2rem',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--danger)',
                  background: 'transparent',
                  color: 'var(--danger)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: '0 auto',
                }}
              >
                <X size={16} />
                Cancel
              </motion.button>
            </>
          ) : error ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={{ fontSize: '3rem', marginBottom: '1rem' }}
              >
                😕
              </motion.div>
              <h2
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  marginBottom: '0.5rem',
                }}
              >
                {error}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Try again later or play with a friend
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button
                  onClick={handleRetry}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
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
                  Try Again
                </motion.button>
                <Link to="/multiplayer/friend" style={{ flex: 1, textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--accent)',
                      background: 'transparent',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Play with Friend
                  </motion.button>
                </Link>
              </div>
            </>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
