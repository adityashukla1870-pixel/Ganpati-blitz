import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Swords, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { getGame } from '../config/games'
import BackButton from '../components/BackButton'

export default function GameModeScreen() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = getGame(gameId)

  if (!game) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#FFF' }}>Game not found.</p>
        <BackButton to="/games" label="Return to Game Hub" />
      </div>
    )
  }

  // Only Modak Rush currently has full socket multiplayer support
  const isMultiplayerAvailable = game.id === 'modak-rush'

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '1.25rem 1rem 4rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        {/* Top Bar with Back to Game Hub */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackButton to="/games" label="Game Hub" />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9CA3AF)', fontWeight: 600 }}>
            Step 1 of 3: Choose Mode
          </div>
        </div>

        {/* Game Banner Header */}
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-xl, 16px)',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.18)',
              background: game.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {game.image ? (
              <img src={game.image} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.4rem' }}>{game.icon}</span>
            )}
          </div>

          <h1
            style={{
              margin: '0.25rem 0 0',
              fontSize: 'clamp(1.7rem, 5vw, 2.3rem)',
              fontWeight: 900,
              fontFamily: 'var(--font-display, inherit)',
              color: '#FFF',
            }}
          >
            {game.name}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #9CA3AF)', maxWidth: 460 }}>
            Select how you want to play {game.name}.
          </p>
        </div>

        {/* Two Mode Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {/* Card 1: SOLO PLAY */}
          <motion.div
            whileHover={{ scale: 1.025, y: -4 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            style={{
              background: 'linear-gradient(180deg, rgba(255, 153, 51, 0.12) 0%, rgba(15, 12, 34, 0.9) 100%)',
              border: '2px solid rgba(255, 153, 51, 0.4)',
              borderRadius: 'var(--radius-xl, 20px)',
              padding: '1.75rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              gap: '1.25rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 153, 51, 0.2)',
                  color: '#FFB347',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                <User size={13} /> Single Player
              </div>

              <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.45rem', fontWeight: 900, color: '#FFF' }}>
                Solo Play
              </h2>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.86rem', color: 'var(--text-muted, #9CA3AF)', lineHeight: 1.5 }}>
                Play against the clock and unlock up to 5 progressive skill difficulty tiers from Easy to Master.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={14} color="#FFD166" />
                  <span>5 Skill Tiers (Easy to Master)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={14} color="#FFD166" />
                  <span>Earn Normalized Universal Points</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>🎯</span>
                  <span>Climb personal best milestones</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/game/${game.id}/difficulty`)}
              style={{
                width: '100%',
                padding: '0.95rem 1.5rem',
                borderRadius: 'var(--radius-lg, 14px)',
                border: 'none',
                background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                color: '#0C081C',
                fontSize: '0.95rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 18px rgba(255, 140, 66, 0.4)',
              }}
            >
              SELECT SOLO <ArrowRight size={17} />
            </motion.button>
          </motion.div>

          {/* Card 2: MULTIPLAYER */}
          <motion.div
            whileHover={isMultiplayerAvailable ? { scale: 1.025, y: -4 } : {}}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            style={{
              background: isMultiplayerAvailable
                ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 12, 34, 0.9) 100%)'
                : 'rgba(15, 12, 34, 0.6)',
              border: isMultiplayerAvailable
                ? '2px solid rgba(56, 189, 248, 0.4)'
                : '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-xl, 20px)',
              padding: '1.75rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: isMultiplayerAvailable ? '0 10px 30px rgba(0,0,0,0.4)' : 'none',
              opacity: isMultiplayerAvailable ? 1 : 0.75,
              gap: '1.25rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: isMultiplayerAvailable ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: isMultiplayerAvailable ? '#38BDF8' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                <Swords size={13} /> {isMultiplayerAvailable ? 'PvP Head-to-Head' : 'Solo Exclusive'}
              </div>

              <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.45rem', fontWeight: 900, color: isMultiplayerAvailable ? '#FFF' : 'var(--text-muted)' }}>
                Multiplayer
              </h2>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.86rem', color: 'var(--text-muted, #9CA3AF)', lineHeight: 1.5 }}>
                {isMultiplayerAvailable
                  ? 'Compete in real time against online players or create a private room to battle friends.'
                  : `${game.name} is currently tuned for solo precision mastery. Online multiplayer is enabled for Modak Rush!`}
              </p>

              {isMultiplayerAvailable ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Swords size={14} color="#38BDF8" />
                    <span>Real-time synchronous seed competition</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trophy size={14} color="#38BDF8" />
                    <span>+35 UP match winner bonus</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>🔑</span>
                    <span>Quick Match & Private Friend Rooms</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md, 10px)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={15} />
                  <span>Solo Mode is currently the active mode for this game.</span>
                </div>
              )}
            </div>

            {isMultiplayerAvailable ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/multiplayer?game=${game.id}`)}
                style={{
                  width: '100%',
                  padding: '0.95rem 1.5rem',
                  borderRadius: 'var(--radius-lg, 14px)',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
                  color: '#FFF',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                }}
              >
                SELECT MULTIPLAYER <ArrowRight size={17} />
              </motion.button>
            ) : (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '0.95rem 1.5rem',
                  borderRadius: 'var(--radius-lg, 14px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                }}
              >
                SOLO ONLY
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
