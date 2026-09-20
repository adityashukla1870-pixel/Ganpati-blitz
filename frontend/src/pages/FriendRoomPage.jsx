import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Copy, Check, Users, LogIn, Plus, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { getSocket, connectSocket, CONNECTION_STATES } from '../services/socket'

export default function FriendRoomPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('mode') === 'join' ? 'join' : 'create')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [player, setPlayer] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const requestTimeoutRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('ganpati_player')
    if (stored) setPlayer(JSON.parse(stored))
  }, [])

  useEffect(() => {
    const paramMode = searchParams.get('mode')
    if (paramMode === 'join' || paramMode === 'create') {
      setTab(paramMode)
    }
  }, [searchParams])

  useEffect(() => {
    const socket = connectSocket()
    if (socket.connected) setSocketConnected(true)

    const onConnect = () => {
      setSocketConnected(true)
      setError('')
    }

    const onDisconnect = () => {
      setSocketConnected(false)
    }

    const onConnectError = () => {
      setSocketConnected(false)
      if (loading) {
        setLoading(false)
        if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
        setError('Cannot reach multiplayer server. Please verify backend service is running.')
      }
    }

    const onRoomCreated = (data) => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      setLoading(false)
      setRoomCode(data.room_code)
    }

    const onPlayerJoined = (data) => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      if (data.room_code && data.players && data.players.length >= 2) {
        setLoading(false)
        navigate('/multiplayer/waiting', { state: { room_code: data.room_code } })
      }
    }

    const onError = (data) => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      setLoading(false)
      setError(data.message || 'Something went wrong')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('room_created', onRoomCreated)
    socket.on('player_joined', onPlayerJoined)
    socket.on('error', onError)

    return () => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('room_created', onRoomCreated)
      socket.off('player_joined', onPlayerJoined)
      socket.off('error', onError)
    }
  }, [navigate, loading])

  const handleCreate = () => {
    if (!player) {
      setError('Please set up your profile first')
      return
    }
    setError('')
    setLoading(true)
    const socket = connectSocket()

    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
    requestTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setError('Room creation timed out. Please check that the backend server is running.')
    }, 8000)

    socket.emit('create_room', {
      player_id: player.player_id,
      display_name: player.display_name,
    })
  }

  const handleJoin = () => {
    if (!player) {
      setError('Please set up your profile first')
      return
    }
    if (!joinCode.trim()) {
      setError('Please enter a room code')
      return
    }
    setError('')
    setLoading(true)
    const socket = connectSocket()

    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
    requestTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setError('Room join timed out. Please verify code or backend status.')
    }, 8000)

    socket.emit('join_room', {
      room_code: joinCode.trim().toUpperCase(),
      player_id: player.player_id,
      display_name: player.display_name,
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGoToWaiting = () => {
    navigate('/multiplayer/waiting', { state: { room_code: roomCode } })
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
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

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            color: 'var(--text)',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          Play with Friend
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            background: 'var(--darker)',
            borderRadius: 'var(--radius-full)',
            padding: 4,
            marginBottom: '2rem',
          }}
        >
          {['create', 'join'].map((t) => (
            <motion.button
              key={t}
              onClick={() => {
                setTab(t)
                setError('')
                setRoomCode('')
                setJoinCode('')
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1,
                padding: '0.7rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: tab === t ? 'var(--primary)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
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
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--danger)',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {tab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              {!roomCode ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, var(--primary), #ff8c5a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                    }}
                  >
                    <Plus size={36} color="#fff" />
                  </motion.div>
                  <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Create a Private Room
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    A unique room code will be generated for you to share
                  </p>
                  <motion.button
                    onClick={handleCreate}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: loading ? 'var(--darker)' : 'var(--primary)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Room'}
                  </motion.button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                  <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    Room Created!
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Share this code with your friend
                  </p>
                  <div
                    style={{
                      background: 'var(--darker)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.2rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        color: 'var(--secondary)',
                        letterSpacing: 6,
                      }}
                    >
                      {roomCode}
                    </span>
                    <motion.button
                      onClick={handleCopy}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: copied ? 'var(--success)' : 'var(--primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {copied ? <Check size={18} color="#fff" /> : <Copy size={18} color="#fff" />}
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={handleGoToWaiting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'var(--success)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Enter Waiting Room
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          {tab === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <motion.div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--accent), #25c9b8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <LogIn size={36} color="#fff" />
              </motion.div>
              <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Join a Room
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Enter the room code your friend shared with you
              </p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--darker)',
                  background: 'var(--darker)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: 6,
                  marginBottom: '1.5rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--darker)')}
              />
              <motion.button
                onClick={handleJoin}
                disabled={loading || !joinCode.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: loading || !joinCode.trim() ? 'var(--darker)' : 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: loading || !joinCode.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {loading ? 'Joining...' : 'Join Room'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
