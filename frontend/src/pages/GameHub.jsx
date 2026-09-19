import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Trophy, Shield, Sparkles, Zap, Flame, Crown, Gamepad2 } from 'lucide-react'
import { GAME_LIST } from '../config/games'
import { getBestScore } from '../utils/storage'
import { getUnlockedTiers } from '../utils/progression'
import { DIFFICULTY_TIERS } from '../config/difficulties'
import BackButton from '../components/BackButton'

const TIER_ICONS = {
  easy: Shield,
  normal: Sparkles,
  hard: Zap,
  expert: Flame,
  master: Crown,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function GameHub() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '1.25rem 1rem 4rem' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Top bar with back button & marquee title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackButton to="/" label="Home" />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(255, 209, 102, 0.12)',
              border: '1px solid rgba(255, 209, 102, 0.25)',
              color: '#FFD166',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Gamepad2 size={15} /> Arcade Cabinet
          </div>
        </div>

        {/* Header Title */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 5.5vw, 2.6rem)',
              fontWeight: 900,
              margin: '0 0 0.4rem',
              fontFamily: 'var(--font-display, inherit)',
              background: 'linear-gradient(135deg, var(--festival-gold, #FFD166), var(--festival-saffron, #FF8C42))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.02em',
            }}
          >
            SELECT YOUR GAME
          </h1>
          <p
            style={{
              color: 'var(--text-muted, #9CA3AF)',
              margin: 0,
              fontSize: '0.92rem',
              maxWidth: 540,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Six distinct festival mini-games. Select a game to choose your mode, test your mastery, and climb the global rankings.
          </p>
        </motion.div>

        {/* 6 Games Grid */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {GAME_LIST.map((game) => {
            const best = getBestScore(game.id)
            const unlockedList = getUnlockedTiers(game.id)
            const highestTierId = unlockedList[unlockedList.length - 1] || 'normal'
            const highestTier = DIFFICULTY_TIERS[highestTierId] || DIFFICULTY_TIERS.normal
            const TierIcon = TIER_ICONS[highestTierId] || Sparkles

            return (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.025, y: -4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                style={{
                  background: 'rgba(15, 12, 34, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-xl, 18px)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle top accent gradient */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: game.gradient,
                  }}
                />

                {/* Game Art & Title Block */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 'var(--radius-lg, 14px)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        background: game.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {game.image ? (
                        <img
                          src={game.image}
                          alt={game.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.8rem' }}>{game.icon}</span>
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2
                        style={{
                          margin: '0 0 0.2rem',
                          fontSize: '1.18rem',
                          fontWeight: 800,
                          color: '#FFF',
                          fontFamily: 'var(--font-display, inherit)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {game.name}
                      </h2>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: highestTier.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        <TierIcon size={13} />
                        <span>Unlocked: {highestTier.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* One-line Description */}
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-muted, #9CA3AF)',
                      margin: '0 0 1rem',
                      lineHeight: 1.45,
                      minHeight: '2.5em',
                    }}
                  >
                    {game.description}
                  </p>
                </div>

                {/* Footer: Personal Best + Play Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted, #9CA3AF)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Personal Best
                    </div>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: best > 0 ? '#FFD166' : 'var(--text-muted)',
                      }}
                    >
                      {best > 0 ? best.toLocaleString() : '---'}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/game/${game.id}/mode`)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: 'var(--radius-lg, 12px)',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                      color: '#0C081C',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 14px rgba(255, 140, 66, 0.35)',
                    }}
                  >
                    <Play size={16} fill="#0C081C" /> PLAY
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </div>
  )
}
