import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Zap, Trophy, Gamepad2, Wifi, WifiOff, Star, ChevronDown } from 'lucide-react'
import { LogoIcon } from '../components/Logo'
import { getSocket, connectSocket, CONNECTION_STATES } from '../services/socket'
import { GAMES } from '../config/games'

const MULTIPLAYER_GAMES = Object.values(GAMES).filter(g => g.multiplayerSupported)

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

const arcadeCard = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.15 + i * 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

const baseCard = {
  background: 'rgba(15, 10, 30, 0.7)',
  border: '2px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 20,
  padding: '2rem 1.5rem',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 220,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  transition: 'border-color 0.3s, box-shadow 0.3s',
}

const glossSheen = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '50%',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)',
  borderRadius: '20px 20px 0 0',
  pointerEvents: 'none',
}

const btnBase = {
  minHeight: 48,
  padding: '0 1.5rem',
  borderRadius: 14,
  border: 'none',
  fontWeight: 800,
  fontSize: '0.85rem',
  letterSpacing: 1.5,
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  textTransform: 'uppercase',
  position: 'relative',
  overflow: 'hidden',
}

export default function MultiplayerPage({ player }) {
  const navigate = useNavigate()
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATES.DISCONNECTED)
  const [selectedGame, setSelectedGame] = useState(MULTIPLAYER_GAMES[0].id)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const socket = connectSocket()

    const onConnect = () => setConnectionStatus(CONNECTION_STATES.CONNECTED)
    const onDisconnect = () => setConnectionStatus(CONNECTION_STATES.DISCONNECTED)
    const onReconnecting = () => setConnectionStatus(CONNECTION_STATES.RECONNECTING)
    const onReconnect = () => setConnectionStatus(CONNECTION_STATES.CONNECTED)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('reconnect_attempt', onReconnecting)
    socket.on('reconnect', onReconnect)

    if (socket.connected) setConnectionStatus(CONNECTION_STATES.CONNECTED)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('reconnect_attempt', onReconnecting)
      socket.off('reconnect', onReconnect)
    }
  }, [])

  const isConnected = connectionStatus === CONNECTION_STATES.CONNECTED
  const selectedGameData = GAMES[selectedGame]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a0612 0%, #110b24 40%, #0d0820 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 50% 40% at 30% 20%, rgba(255,94,58,0.10) 0%, transparent 70%),
            radial-gradient(ellipse 45% 35% at 75% 70%, rgba(139,69,219,0.09) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 50% 90%, rgba(255,209,102,0.06) 0%, transparent 50%)
          `,
        }}
      />

      {/* Scanlines overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.03,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 960, margin: '0 auto', padding: '0 1rem' }}>
        {/* ─── HEADER ─── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 0',
          }}
        >
          <Link
            to="/games"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'rgba(255,255,255,0.5)',
              minHeight: 44,
            }}
          >
            <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.9 }}>
              <ArrowLeft size={20} />
            </motion.div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Games</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              animate={isConnected ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isConnected ? '#22c55e' : '#ef4444',
                boxShadow: isConnected
                  ? '0 0 8px #22c55e, 0 0 20px rgba(34,197,94,0.4)'
                  : '0 0 8px #ef4444',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isConnected ? '#22c55e' : '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {isConnected ? 'Connected' : connectionStatus === CONNECTION_STATES.RECONNECTING ? 'Reconnecting...' : 'Disconnected'}
            </span>
          </div>
        </motion.header>

        {/* ─── TITLE ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
            <h1
              style={{
                fontFamily: 'var(--font-display, var(--font-sans))',
                fontSize: 'clamp(1.8rem, 6vw, 3rem)',
                fontWeight: 900,
                margin: 0,
                color: '#fff',
                letterSpacing: '-0.5px',
                textShadow: '0 0 40px rgba(255,153,51,0.4), 0 0 80px rgba(255,94,58,0.2)',
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
              }}
            >
              <LogoIcon size={32} /> MULTIPLAYER
            </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.85rem',
              fontWeight: 500,
              margin: '0.5rem 0 0',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Choose your arena
          </p>
        </motion.div>

        {/* ─── PLAYER CARD ─── */}
        {player && (
          <motion.div
            custom={0}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            style={{
              ...baseCard,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              gap: '1.25rem',
              minHeight: 'auto',
              padding: '1rem 1.5rem',
              marginBottom: '1.5rem',
              borderColor: 'rgba(255,153,51,0.15)',
            }}
          >
            <div style={glossSheen} />
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff5e3a, #ff9933)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 900,
                color: '#1a0a00',
                flexShrink: 0,
                boxShadow: '0 0 20px rgba(255,94,58,0.4)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {(player.display_name || 'P')[0].toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {player.display_name}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.35)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  {player.campus || 'Unknown Campus'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={13} style={{ color: '#ffd166' }} fill="#ffd166" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffd166' }}>
                    {player.rating ?? 1000}
                  </span>
                </div>
                {player.wins !== undefined && player.losses !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#22c55e' }}>
                      {player.wins}W
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>/</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>
                      {player.losses}L
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255,209,102,0.08)',
                border: '1px solid rgba(255,209,102,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
                color: '#ffd166',
              }}
            >
              <Trophy size={18} />
            </div>
          </motion.div>
        )}

        {/* ─── MODE CARDS ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {/* FRIEND MATCH */}
          <motion.div
            custom={0}
            variants={arcadeCard}
            initial="hidden"
            animate="visible"
            whileHover={{
              scale: 1.02,
              borderColor: 'rgba(255,94,58,0.5)',
              boxShadow: '0 0 40px rgba(255,94,58,0.15), 0 20px 60px rgba(0,0,0,0.3)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/multiplayer/friend')}
            style={{
              ...baseCard,
              borderColor: 'rgba(255,94,58,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 20px rgba(255,94,58,0.05)',
            }}
          >
            <div style={glossSheen} />

            {/* Gradient orb */}
            <div
              style={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,94,58,0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: 'linear-gradient(135deg, #ff5e3a 0%, #ff9933 50%, #ffd166 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 8px 30px rgba(255,94,58,0.4), inset 0 2px 0 rgba(255,255,255,0.25)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Users size={36} color="#1a0a00" strokeWidth={2.5} />
            </motion.div>

            <h2
              style={{
                fontFamily: 'var(--font-display, var(--font-sans))',
                fontSize: '1.35rem',
                fontWeight: 900,
                color: '#fff',
                margin: '0 0 0.4rem',
                letterSpacing: 1.5,
                position: 'relative',
                zIndex: 1,
              }}
            >
              FRIEND MATCH
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                margin: '0 0 1.5rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Challenge a friend in a private room
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/multiplayer/friend?mode=create')
                }}
                style={{
                  ...btnBase,
                  flex: 1,
                  minWidth: 130,
                  background: 'linear-gradient(135deg, #ff5e3a, #ff9933)',
                  color: '#1a0a00',
                  boxShadow: '0 4px 16px rgba(255,94,58,0.4)',
                }}
              >
                <Zap size={16} fill="#1a0a00" />
                Create Room
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/multiplayer/friend?mode=join')
                }}
                style={{
                  ...btnBase,
                  flex: 1,
                  minWidth: 130,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                Join Room
              </motion.button>
            </div>
          </motion.div>

          {/* QUICK MATCH */}
          <motion.div
            custom={1}
            variants={arcadeCard}
            initial="hidden"
            animate="visible"
            whileHover={{
              scale: 1.02,
              borderColor: 'rgba(139,69,219,0.5)',
              boxShadow: '0 0 40px rgba(139,69,219,0.15), 0 20px 60px rgba(0,0,0,0.3)',
            }}
            whileTap={{ scale: 0.98 }}
            style={{
              ...baseCard,
              borderColor: 'rgba(139,69,219,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 20px rgba(139,69,219,0.05)',
            }}
          >
            <div style={glossSheen} />

            {/* Gradient orb */}
            <div
              style={{
                position: 'absolute',
                top: -40,
                left: -40,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,69,219,0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(139,69,219,0.4), inset 0 2px 0 rgba(255,255,255,0.25)',
                  '0 0 40px rgba(139,69,219,0.6), inset 0 2px 0 rgba(255,255,255,0.25)',
                  '0 0 20px rgba(139,69,219,0.4), inset 0 2px 0 rgba(255,255,255,0.25)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: 'linear-gradient(135deg, #8b45d6 0%, #a855f7 50%, #d8b4fe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Zap size={36} color="#fff" strokeWidth={2.5} />
            </motion.div>

            <h2
              style={{
                fontFamily: 'var(--font-display, var(--font-sans))',
                fontSize: '1.35rem',
                fontWeight: 900,
                color: '#fff',
                margin: '0 0 0.4rem',
                letterSpacing: 1.5,
                position: 'relative',
                zIndex: 1,
              }}
            >
              QUICK MATCH
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                margin: '0 0 1rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Find an opponent instantly
            </p>

            {/* Game Selector */}
            <div
              style={{
                width: '100%',
                position: 'relative',
                zIndex: 10,
                marginBottom: '1.25rem',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(!showDropdown)
                }}
                style={{
                  width: '100%',
                  minHeight: 44,
                  padding: '0 1rem',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>{selectedGameData.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{selectedGameData.name}</span>
                <motion.div animate={{ rotate: showDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </motion.div>
              </motion.button>

              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(20, 12, 40, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    zIndex: 50,
                  }}
                >
                  {MULTIPLAYER_GAMES.map((game) => (
                    <motion.button
                      key={game.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedGame(game.id)
                        setShowDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        padding: '0 1rem',
                        border: 'none',
                        background:
                          game.id === selectedGame
                            ? 'rgba(255,255,255,0.08)'
                            : 'transparent',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: game.id === selectedGame ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontFamily: 'var(--font-sans)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{game.icon}</span>
                      <span>{game.name}</span>
                      {game.id === selectedGame && (
                        <span style={{ marginLeft: 'auto', color: '#a855f7', fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1 }}>
                          SELECTED
                        </span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/multiplayer/quick-match?game=${selectedGame}`)
              }}
              style={{
                ...btnBase,
                width: '100%',
                background: 'linear-gradient(135deg, #8b45d6, #a855f7)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(139,69,219,0.4)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Zap size={16} />
              Find Match
            </motion.button>
          </motion.div>
        </div>

        {/* ─── BOTTOM SECTION ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '0.75rem',
            paddingBottom: '2rem',
          }}
        >
          {[
            {
              to: '/multiplayer/leaderboard',
              icon: <Trophy size={20} />,
              title: 'Rankings',
              sub: 'View multiplayer leaderboard',
              color: '#ffd166',
            },
            {
              to: '/multiplayer/history',
              icon: <Gamepad2 size={20} />,
              title: 'Match History',
              sub: 'View your past matches',
              color: '#a855f7',
            },
          ].map((item, i) => (
            <motion.div
              key={item.to}
              custom={2 + i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
            >
              <Link to={item.to} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.03, borderColor: `${item.color}40` }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '1rem 1.25rem',
                    background: 'rgba(15, 10, 30, 0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    cursor: 'pointer',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    transition: 'border-color 0.3s',
                    minHeight: 56,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                      {item.sub}
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Click-away for dropdown */}
      {showDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 5 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
