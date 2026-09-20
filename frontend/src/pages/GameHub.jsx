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

        {/* 6 Games Grid - 100% Full Uncropped Artwork Cards with Attractive Overlays */}
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
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                onClick={() => navigate(`/game/${game.id}/mode`)}
                className="arcade-game-card"
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--radius-xl, 22px)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
                  border: '1.5px solid rgba(255, 255, 255, 0.14)',
                  background: 'rgba(16, 12, 34, 0.95)',
                }}
              >
                {/* Top Accent Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: game.gradient,
                    zIndex: 5,
                  }}
                />

                {/* 100% Full Uncropped Artwork (1:1 Ratio) */}
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.name}
                    className="game-art-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.45s ease',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '5rem',
                      background: game.gradient,
                    }}
                  >
                    {game.icon}
                  </div>
                )}

                {/* Subtle Vignette Overlays for Legibility */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '35%',
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '45%',
                    background: 'linear-gradient(0deg, rgba(10, 8, 22, 0.88) 0%, rgba(10, 8, 22, 0.4) 60%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                {/* Top Overlay: Unlocked Tier & Mode Badges */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    right: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                    zIndex: 4,
                  }}
                >
                  {/* Unlocked Tier Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.28rem 0.65rem',
                      borderRadius: '9999px',
                      background: 'rgba(10, 8, 24, 0.78)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: `1.5px solid ${highestTier.color}aa`,
                      color: highestTier.color,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <TierIcon size={12} />
                    <span>Unlocked: {highestTier.name}</span>
                  </div>

                  {/* Mode / Duration Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.28rem 0.65rem',
                      borderRadius: '9999px',
                      background: 'rgba(10, 8, 24, 0.78)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <span>{game.icon}</span>
                    <span>{game.duration ? `${game.duration}s Blitz` : 'Endless'}</span>
                  </div>
                </div>

                {/* Center Overlay: Glowing Arcade Play Button */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    className="overlay-play-disc"
                    style={{
                      width: 'clamp(54px, 13vw, 64px)',
                      height: 'clamp(54px, 13vw, 64px)',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 28px rgba(255, 140, 66, 0.75), 0 4px 18px rgba(0, 0, 0, 0.6)',
                      border: '2.5px solid rgba(255, 255, 255, 0.8)',
                      color: '#0C081C',
                      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                    }}
                  >
                    <Play size={25} fill="#0C081C" style={{ marginLeft: 3 }} />
                  </div>
                </div>

                {/* Bottom Overlay Dock: Title, Description, PB & Play Action */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    right: 10,
                    padding: '0.65rem 0.85rem',
                    background: 'linear-gradient(180deg, rgba(12, 9, 26, 0.75) 0%, rgba(12, 9, 26, 0.94) 100%)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 'var(--radius-lg, 14px)',
                    zIndex: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55)',
                  }}
                >
                  {/* Left: Title + Details */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 'clamp(1rem, 3.2vw, 1.2rem)',
                          fontWeight: 900,
                          color: '#FFF',
                          fontFamily: 'var(--font-display, inherit)',
                          letterSpacing: '0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {game.name}
                      </h2>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          color: best > 0 ? '#FFD166' : 'var(--text-muted)',
                          fontFamily: 'var(--font-mono, monospace)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {best > 0 ? `PB: ${best.toLocaleString()}` : 'PB: ---'}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: '0.1rem 0 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                      }}
                    >
                      {game.description}
                    </p>
                  </div>

                  {/* Right: Direct Play Button */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/game/${game.id}/mode`)
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                      color: '#0C081C',
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 14px rgba(255, 140, 66, 0.45)',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}
                  >
                    <Play size={13} fill="#0C081C" /> PLAY
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
