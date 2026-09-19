import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Copy, Check, Loader2, LogOut } from 'lucide-react'
import { getSocket } from '../services/socket'

export default function WaitingRoomPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomCode = location.state?.room_code || ''
  const [player, setPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [ready, setReady] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [matchData, setMatchData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('ganpati_player')
    if (stored) setPlayer(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (!roomCode) {
      navigate('/multiplayer/friend')
      return
    }

    const socket = getSocket()

    const onRoomState = (data) => {
      setPlayers(data.players || [])
      if (data.countdown) {
        setCountdown(data.countdown)
      }
    }

    const onPlayerJoined = (data) => {
      if (data.players) {
        setPlayers(data.players.map(p => ({ ...p, ready: false })))
      }
    }

    const onPlayerLeft = (data) => {
      setPlayers((prev) => prev.filter((p) => p.player_id !== data.player_id))
      setReady(false)
    }

    const onPlayerReady = (data) => {
      setPlayers((prev) =>
        prev.map((p) => (p.player_id === data.player_id ? { ...p, ready: true } : p))
      )
    }

    const onStartCountdown = (data) => {
      setMatchData({
        seed: data.seed,
        match_id: data.match_id,
        players: data.players,
      })
      setCountdown(3)
    }

    const onGameStart = (data) => {
      navigate('/multiplayer/game', {
        state: {
          room_code: roomCode,
          seed: data.seed,
          match_id: data.match_id,
          opponent: data.opponent,
        },
      })
    }

    const onError = (data) => {
      setError(data.message || 'An error occurred')
    }

    socket.emit('join_room', {
      room_code: roomCode,
      player_id: player?.player_id,
      display_name: player?.display_name,
    })

    socket.on('room_state', onRoomState)
    socket.on('player_joined', onPlayerJoined)
    socket.on('player_left', onPlayerLeft)
    socket.on('player_ready', onPlayerReady)
    socket.on('start_countdown', onStartCountdown)
    socket.on('game_start', onGameStart)
    socket.on('error', onError)

    return () => {
      socket.off('room_state', onRoomState)
      socket.off('player_joined', onPlayerJoined)
      socket.off('player_left', onPlayerLeft)
      socket.off('player_ready', onPlayerReady)
      socket.off('start_countdown', onStartCountdown)
      socket.off('game_start', onGameStart)
      socket.off('error', onError)
    }
  }, [roomCode, navigate, player])

  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    if (countdown === 0 && matchData) {
      navigate('/multiplayer/game', {
        state: {
          room_code: roomCode,
          seed: matchData.seed,
          match_id: matchData.match_id,
          players: matchData.players,
        },
      })
    }
  }, [countdown, matchData, navigate, roomCode])

  const handleReady = useCallback(() => {
    const socket = getSocket()
    socket.emit('player_ready', {
      room_code: roomCode,
      player_id: player?.player_id,
    })
    setReady(true)
  }, [roomCode, player])

  const handleLeave = useCallback(() => {
    const socket = getSocket()
    socket.emit('leave_room', {
      room_code: roomCode,
      player_id: player?.player_id,
    })
    navigate('/multiplayer')
  }, [roomCode, player, navigate])

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const myReady = players.find((p) => p.player_id === player?.player_id)?.ready || false
  const opponentReady = players.find((p) => p.player_id !== player?.player_id)?.ready || false
  const opponent = players.find((p) => p.player_id !== player?.player_id)

  if (countdown !== null && countdown > 0) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 88px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence>
          <motion.div
            key={countdown}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              fontSize: '8rem',
              fontWeight: 900,
              fontFamily: 'var(--font-sans)',
              color: countdown === 1 ? 'var(--danger)' : countdown === 2 ? 'var(--secondary)' : 'var(--primary)',
              textShadow: `0 0 40px ${countdown === 1 ? 'var(--danger)' : countdown === 2 ? 'var(--secondary)' : 'var(--primary)'}`,
            }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <motion.div
              onClick={handleLeave}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} />
              <span style={{ fontSize: '0.85rem' }}>Leave</span>
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                padding: '0.8rem 1rem',
                marginBottom: '1.5rem',
                color: 'var(--danger)',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: '1rem',
            }}
          >
            Waiting Room
          </h1>

          <motion.div
            whileHover={{ scale: 1.03 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--card)',
              borderRadius: 'var(--radius-full)',
              padding: '0.6rem 1.2rem',
              cursor: 'pointer',
            }}
            onClick={handleCopy}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Room:
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--secondary)',
                letterSpacing: 3,
              }}
            >
              {roomCode}
            </span>
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} color="var(--text-muted)" />}
          </motion.div>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '1rem',
            alignItems: 'start',
            marginBottom: '2rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              textAlign: 'center',
              border: myReady ? '2px solid var(--success)' : '2px solid var(--darker)',
              transition: 'border-color 0.3s',
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 'var(--radius-full)',
                background: myReady ? 'var(--success)' : 'var(--darker)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.8rem',
                fontSize: '1.5rem',
              }}
            >
              {player?.display_name?.[0]?.toUpperCase() || 'Y'}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
              {player?.display_name || 'You'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>(You)</div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: myReady ? 'rgba(76, 175, 80, 0.15)' : 'var(--darker)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: myReady ? 'var(--success)' : 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              {myReady ? '✓ READY' : 'NOT READY'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '2rem',
            }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>VS</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              textAlign: 'center',
              border: opponentReady ? '2px solid var(--success)' : '2px solid var(--darker)',
              transition: 'border-color 0.3s',
            }}
          >
            {opponent ? (
              <>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 'var(--radius-full)',
                    background: opponentReady ? 'var(--success)' : 'var(--darker)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.8rem',
                    fontSize: '1.5rem',
                  }}
                >
                  {opponent.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  {opponent.display_name}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: opponentReady ? 'rgba(76, 175, 80, 0.15)' : 'var(--darker)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: opponentReady ? 'var(--success)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {opponentReady ? '✓ READY' : 'NOT READY'}
                </div>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--darker)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.8rem',
                  }}
                >
                  <Loader2 size={24} style={{ color: 'var(--text-muted)' }} />
                </motion.div>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  Waiting...
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Share the room code
                </div>
              </>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          {!ready ? (
            <motion.button
              onClick={handleReady}
              disabled={!opponent}
              whileHover={{ scale: opponent ? 1.03 : 1 }}
              whileTap={{ scale: opponent ? 0.97 : 1 }}
              style={{
                width: '100%',
                maxWidth: 300,
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: opponent ? 'var(--success)' : 'var(--darker)',
                color: opponent ? '#fff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: opponent ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              READY
            </motion.button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={18} />
              </motion.div>
              Waiting for opponent...
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
