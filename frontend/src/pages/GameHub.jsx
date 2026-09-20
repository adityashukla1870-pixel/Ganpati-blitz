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

        {/* 6 Games Grid - Image-First Visual Arcade Cards */}
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
                  background: 'rgba(16, 12, 34, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-xl, 20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
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
                    zIndex: 4,
                  }}
                />

                {/* Big Featured Game Image with Overlay Badges & Play Button */}
                <div
                  className="game-art-container"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 'clamp(170px, 36vw, 210px)',
                    overflow: 'hidden',
                    background: 'rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {/* Game Art */}
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.name}
                      className="game-art-img"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
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
                        fontSize: '4.5rem',
                        background: game.gradient,
                      }}
                    >
                      {game.icon}
                    </div>
                  )}

                  {/* Cinematic Dark Vignette */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.08) 40%, rgba(16, 12, 34, 0.95) 100%)',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />

                  {/* Top-Left: Unlocked Tier Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 3,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      background: 'rgba(0, 0, 0, 0.72)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: `1px solid ${highestTier.color}88`,
                      color: highestTier.color,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <TierIcon size={12} />
                    <span>Unlocked: {highestTier.name}</span>
                  </div>

                  {/* Top-Right: Game Mode Tag (Multiplayer / Solo) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 3,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '9999px',
                      background: 'rgba(0, 0, 0, 0.72)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <span>{game.icon}</span>
                    <span>{game.multiplayerSupported ? '1v1 & Solo' : 'Solo'}</span>
                  </div>

                  {/* Center Overlay: Glowing Arcade Play Button */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      className="overlay-play-disc"
                      style={{
                        width: 'clamp(52px, 12vw, 62px)',
                        height: 'clamp(52px, 12vw, 62px)',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 25px rgba(255, 140, 66, 0.65), 0 4px 16px rgba(0, 0, 0, 0.6)',
                        border: '2px solid rgba(255, 255, 255, 0.7)',
                        color: '#0C081C',
                        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                      }}
                    >
                      <Play size={24} fill="#0C081C" style={{ marginLeft: 3 }} />
                    </div>
                  </div>
                </div>

                {/* Card Info Body */}
                <div
                  style={{
                    padding: '1rem 1.15rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    flex: 1,
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: '#FFF',
                          fontFamily: 'var(--font-display, inherit)',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {game.name}
                      </h2>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'var(--text-muted, #9CA3AF)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {game.duration ? `${game.duration}s Blitz` : 'Endless'}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-muted, #9CA3AF)',
                        margin: '0 0 0.75rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {game.description}
                    </p>
                  </div>

                  {/* Footer Row: Personal Best & Play Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.62rem',
                          color: 'var(--text-muted, #9CA3AF)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 700,
                        }}
                      >
                        Personal Best
                      </div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: best > 0 ? '#FFD166' : 'var(--text-muted)',
                          lineHeight: 1.2,
                        }}
                      >
                        {best > 0 ? best.toLocaleString() : '---'}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/game/${game.id}/mode`)
                      }}
                      style={{
                        padding: '0.55rem 1.15rem',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
                        color: '#0C081C',
                        fontSize: '0.85rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 14px rgba(255, 140, 66, 0.35)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <Play size={14} fill="#0C081C" /> PLAY
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </div>
  )
}
