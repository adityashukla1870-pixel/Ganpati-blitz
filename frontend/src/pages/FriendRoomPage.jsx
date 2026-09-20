import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Copy, Check, Users, LogIn, Plus, AlertCircle, RefreshCw, Wifi, WifiOff, Share2, Sparkles, User, Play, Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { getSocket, connectSocket, warmUpBackend, CONNECTION_STATES } from '../services/socket'
import { GAMES } from '../config/games'

export default function FriendRoomPage({ player: playerProp, onPlayerSetup }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'join' || searchParams.get('code') ? 'join' : 'create'
  const initialCode = (searchParams.get('code') || '').trim().toUpperCase()

  const [tab, setTab] = useState(initialMode)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [player, setPlayer] = useState(() => {
    if (playerProp) return playerProp
    const stored = localStorage.getItem('ganpati_player')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (_) {
        return null
      }
    }
    return null
  })
  const [guestName, setGuestName] = useState('')
  const [socketConnected, setSocketConnected] = useState(false)
  const requestTimeoutRef = useRef(null)
  const playerRef = useRef(player)

  useEffect(() => {
    playerRef.current = player
  }, [player])

  // Pre-warm backend immediately on mount
  useEffect(() => {
    warmUpBackend()
  }, [])

  // Sync player prop
  useEffect(() => {
    if (playerProp) setPlayer(playerProp)
  }, [playerProp])

  // Sync query parameters
  useEffect(() => {
    const paramMode = searchParams.get('mode')
    const paramCode = searchParams.get('code')
    if (paramCode) {
      setJoinCode(paramCode.trim().toUpperCase())
      setTab('join')
    } else if (paramMode === 'join' || paramMode === 'create') {
      setTab(paramMode)
    }
  }, [searchParams])

  // Ensure an active player profile exists or create guest
  const ensurePlayer = (customName = '') => {
    if (playerRef.current && (playerRef.current.player_id || playerRef.current.id)) {
      return playerRef.current
    }

    const trimmed = (customName || guestName || '').trim()
    const guestId = `guest_${uuidv4().replace(/-/g, '').slice(0, 12)}`
    const newGuest = {
      player_id: guestId,
      id: guestId,
      display_name: chosenName,
      name: chosenName,
      campus: 'Online Arena',
      avatar: '🪷',
      rating: 1000,
      universal_points: 0,
      is_guest: true,
      created_at: new Date().toISOString(),
    }

    localStorage.setItem('ganpati_player', JSON.stringify(newGuest))
    setPlayer(newGuest)
    playerRef.current = newGuest
    onPlayerSetup?.(newGuest)
    return newGuest
  }

  // Socket listener registration (independent of loading state)
  useEffect(() => {
    const socket = connectSocket()
    if (socket.connected) {
      setSocketConnected(true)
    }

    const onConnect = () => {
      setSocketConnected(true)
      setStatusMsg((prev) => (prev.includes('Connecting') ? 'Connected to server!' : prev))
    }

    const onDisconnect = () => {
      setSocketConnected(false)
    }

    const onConnectError = (err) => {
      setSocketConnected(false)
      console.warn('Socket connect error:', err?.message)
    }

    const onRoomCreated = (data) => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      setLoading(false)
      setStatusMsg('')
      setRoomCode(data.room_code)
      sessionStorage.setItem('last_room_code', data.room_code)
    }

    const onPlayerJoined = (data) => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      if (data.room_code) {
        sessionStorage.setItem('last_room_code', data.room_code)
      }
      if (data.room_code && data.players && data.players.length >= 2) {
        setLoading(false)
        setStatusMsg('')
        navigate('/multiplayer/waiting', { state: { room_code: data.room_code } })
      }
    }

    const onError = (data) => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
      setLoading(false)
      setStatusMsg('')
      setError(data?.message || 'Multiplayer action failed. Please try again.')
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
  }, [navigate])

  const handleCreate = () => {
    setError('')
    const activePlayer = ensurePlayer()
    const playerId = activePlayer?.player_id || activePlayer?.id
    const displayName = activePlayer?.display_name || activePlayer?.name || 'Player'

    if (!playerId) {
      setError('Unable to initialize player profile. Please try again.')
      return
    }

    setLoading(true)
    setStatusMsg('Connecting to room server...')

    const socket = connectSocket()

    // Safety timeout: 35s to account for Render free-tier cold boot
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
    requestTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setStatusMsg('')
      setError('Room creation timed out. The backend server might be waking up. Please tap Create Room again.')
    }, 35000)

    const doEmit = () => {
      setStatusMsg('Generating unique private room...')
      socket.emit('create_room', {
        player_id: playerId,
        display_name: displayName,
        game_id: 'modak-rush',
      })
    }

    if (socket.connected) {
      doEmit()
    } else {
      setStatusMsg('Waking up multiplayer server (may take ~15s on first try)...')
      socket.once('connect', doEmit)
    }
  }

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setError('Please enter a 5-character room code')
      return
    }

    setError('')
    const activePlayer = ensurePlayer()
    const playerId = activePlayer?.player_id || activePlayer?.id
    const displayName = activePlayer?.display_name || activePlayer?.name || 'Player'

    if (!playerId) {
      setError('Unable to initialize player profile. Please try again.')
      return
    }

    setLoading(true)
    setStatusMsg('Connecting to room...')

    const socket = connectSocket()
    const targetRoom = joinCode.trim().toUpperCase()

    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current)
    requestTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setStatusMsg('')
      setError('Join request timed out. Please verify the code and try again.')
    }, 35000)

    const doEmit = () => {
      setStatusMsg(`Joining room ${targetRoom}...`)
      socket.emit('join_room', {
        room_code: targetRoom,
        player_id: playerId,
        display_name: displayName,
      })
    }

    if (socket.connected) {
      doEmit()
    } else {
      setStatusMsg('Waking up multiplayer server...')
      socket.once('connect', doEmit)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/multiplayer/friend?mode=join&code=${roomCode}`
    navigator.clipboard.writeText(inviteUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  const handleShare = () => {
    const inviteUrl = `${window.location.origin}/multiplayer/friend?mode=join&code=${roomCode}`
    if (navigator.share) {
      navigator.share({
        title: 'Ganpati Blitz PvP Challenge',
        text: `Play with me in Ganpati Blitz! Room Code: ${roomCode}`,
        url: inviteUrl,
      }).catch(() => handleCopyLink())
    } else {
      handleCopyLink()
    }
  }

  const handleGoToWaiting = () => {
    navigate('/multiplayer/waiting', { state: { room_code: roomCode, isHost: true } })
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        {/* Navigation / Back Bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}
        >
          <Link to="/multiplayer" style={{ textDecoration: 'none' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-muted, #9CA3AF)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={18} />
              <span>Multiplayer Hub</span>
            </div>
          </Link>

          {/* Connection Status Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: socketConnected ? '#22C55E' : '#EAB308',
              background: socketConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
              border: `1px solid ${socketConnected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
              borderRadius: '9999px',
              padding: '0.22rem 0.65rem',
            }}
          >
            {socketConnected ? <Wifi size={12} /> : <RefreshCw size={12} className="spin" />}
            <span>{socketConnected ? 'Server Ready' : 'Connecting...'}</span>
          </div>
        </motion.div>

        {/* Title & Game Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(255, 140, 66, 0.14)',
              border: '1px solid rgba(255, 140, 66, 0.3)',
              color: '#FFB347',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.65rem',
            }}
          >
            <Users size={13} /> Private 1v1 Arena
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 'clamp(1.75rem, 5vw, 2.2rem)',
              fontWeight: 900,
              color: '#FFF',
              margin: '0 0 0.4rem',
            }}
          >
            Play with Friend
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted, #9CA3AF)' }}>
            Instant head-to-head match in <strong style={{ color: '#FFD166' }}>Modak Rush</strong>
          </p>
        </motion.div>

        {/* Active Player Card or Quick Profile Setup */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(22, 16, 46, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-xl, 18px)',
            padding: '0.9rem 1.15rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(12px)',
          }}
        >
          {player ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF8C42, #FFD166)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(255, 140, 66, 0.35)',
                  }}
                >
                  {player.avatar || '🪷'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#FFF', fontWeight: 800, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.display_name || player.name}
                    </span>
                    {player.is_guest && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', color: '#9CA3AF', padding: '1px 5px', borderRadius: 4 }}>
                        Guest
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9CA3AF)' }}>
                    {player.campus || 'Online Arena'} • Rating: {player.rating ?? 1000}
                  </span>
                </div>
              </div>

              <Link
                to={`/player?mode=login&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#FFB347',
                  textDecoration: 'none',
                  flexShrink: 0,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 140, 66, 0.12)',
                  border: '1px solid rgba(255, 140, 66, 0.25)',
                }}
              >
                {player.is_guest ? 'Sign In' : 'Switch'}
              </Link>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#FFD166', fontSize: '0.82rem', fontWeight: 800 }}>
                <Sparkles size={14} /> Quick Player Setup
              </div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted, #9CA3AF)' }}>
                Enter your nickname below to create or join a room instantly:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. ModakChamp"
                  maxLength={18}
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(10, 8, 24, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 'var(--radius-md, 10px)',
                    color: '#FFF',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => ensurePlayer(guestName)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md, 10px)',
                    background: 'linear-gradient(135deg, #FF8C42, #FFD166)',
                    border: 'none',
                    color: '#0C081C',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Set Name
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tab Navigation Switcher (Create vs Join) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            background: 'rgba(12, 9, 26, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-full, 9999px)',
            padding: 4,
            marginBottom: '1.5rem',
          }}
        >
          {['create', 'join'].map((t) => (
            <motion.button
              key={t}
              onClick={() => {
                setTab(t)
                setError('')
                setStatusMsg('')
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-full, 9999px)',
                border: 'none',
                background: tab === t ? 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))' : 'transparent',
                color: tab === t ? '#0C081C' : 'var(--text-muted, #9CA3AF)',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                boxShadow: tab === t ? '0 4px 14px rgba(255, 140, 66, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </motion.button>
          ))}
        </motion.div>

        {/* Error Alert Box */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#FCA5A5',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Message / Warm-up notice */}
        <AnimatePresence>
          {loading && statusMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: '0.8rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#7DD3FC',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <Loader2 size={18} className="spin" style={{ flexShrink: 0 }} />
              <span>{statusMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              style={{
                background: 'rgba(18, 14, 38, 0.85)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-xl, 22px)',
                padding: '1.75rem 1.5rem',
                textAlign: 'center',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
              }}
            >
              {!roomCode ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      boxShadow: '0 0 24px rgba(255, 140, 66, 0.45)',
                    }}
                  >
                    <Plus size={36} color="#0C081C" strokeWidth={2.8} />
                  </motion.div>

                  <h2 style={{ color: '#FFF', fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.4rem' }}>
                    Create a Private Room
                  </h2>
                  <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: '0.85rem', margin: '0 0 1.5rem', lineHeight: 1.4 }}>
                    Generate a 5-character private room code to challenge a friend in real-time.
                  </p>

                  <motion.button
                    onClick={handleCreate}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.03 }}
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg, 14px)',
                      border: 'none',
                      background: loading ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                      color: loading ? 'var(--text-muted)' : '#0C081C',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: '0.04em',
                      boxShadow: loading ? 'none' : '0 4px 18px rgba(255, 140, 66, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="spin" />
                        <span>Creating Room...</span>
                      </>
                    ) : (
                      <>
                        <Play size={18} fill="#0C081C" />
                        <span>CREATE ROOM NOW</span>
                      </>
                    )}
                  </motion.button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>🎉</div>
                  <h2 style={{ color: '#FFF', fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.35rem' }}>
                    Room Created!
                  </h2>
                  <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
                    Share this code or link with your friend to start:
                  </p>

                  {/* Room Code Display Card */}
                  <div
                    style={{
                      background: 'rgba(10, 8, 22, 0.9)',
                      border: '2px solid rgba(255, 209, 102, 0.35)',
                      borderRadius: 'var(--radius-lg, 16px)',
                      padding: '1.25rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 14,
                      boxShadow: '0 0 28px rgba(255, 209, 102, 0.15)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 'clamp(2rem, 7vw, 2.5rem)',
                        fontWeight: 900,
                        color: '#FFD166',
                        letterSpacing: '0.25em',
                      }}
                    >
                      {roomCode}
                    </span>

                    <motion.button
                      onClick={handleCopyCode}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Copy Code"
                      style={{
                        background: copied ? '#22C55E' : 'linear-gradient(135deg, #FF8C42, #FFD166)',
                        border: 'none',
                        borderRadius: 'var(--radius-md, 10px)',
                        padding: '0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0C081C',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      }}
                    >
                      {copied ? <Check size={20} color="#FFF" /> : <Copy size={20} />}
                    </motion.button>
                  </div>

                  {/* Action Buttons: Share Invite & Enter Waiting Room */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <motion.button
                      onClick={handleShare}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-lg, 14px)',
                        border: '1.5px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFF',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {linkCopied ? <Check size={18} color="#22C55E" /> : <Share2 size={18} />}
                      <span>{linkCopied ? 'Invite Link Copied!' : 'Share Room Invite Link'}</span>
                    </motion.button>

                    <motion.button
                      onClick={handleGoToWaiting}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: 'var(--radius-lg, 14px)',
                        border: 'none',
                        background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                        color: '#FFF',
                        fontWeight: 900,
                        fontSize: '0.98rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 18px rgba(34, 197, 94, 0.4)',
                      }}
                    >
                      <Play size={18} fill="#FFF" />
                      <span>ENTER WAITING ROOM</span>
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              style={{
                background: 'rgba(18, 14, 38, 0.85)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-xl, 22px)',
                padding: '1.75rem 1.5rem',
                textAlign: 'center',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
              }}
            >
              <motion.div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 0 24px rgba(56, 189, 248, 0.45)',
                }}
              >
                <LogIn size={36} color="#FFF" />
              </motion.div>

              <h2 style={{ color: '#FFF', fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.4rem' }}>
                Join a Room
              </h2>
              <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
                Enter the 5-character code your friend shared with you:
              </p>

              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joinCode.trim() && !loading) {
                    handleJoin()
                  }
                }}
                placeholder="ABC12"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg, 14px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(10, 8, 22, 0.95)',
                  color: '#FFD166',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: '0.25em',
                  marginBottom: '1.5rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#38BDF8')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)')}
              />

              <motion.button
                onClick={handleJoin}
                disabled={loading || !joinCode.trim()}
                whileHover={{ scale: loading || !joinCode.trim() ? 1 : 1.03 }}
                whileTap={{ scale: loading || !joinCode.trim() ? 1 : 0.97 }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg, 14px)',
                  border: 'none',
                  background: loading || !joinCode.trim() ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #0284C7, #38BDF8)',
                  color: loading || !joinCode.trim() ? 'var(--text-muted)' : '#FFF',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: loading || !joinCode.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.04em',
                  boxShadow: loading || !joinCode.trim() ? 'none' : '0 4px 18px rgba(2, 132, 199, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Connecting to Room...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>JOIN ROOM</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
