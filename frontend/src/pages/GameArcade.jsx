import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Play, Swords, Dice5, Flame, User, Zap, Star } from 'lucide-react'
import { GAME_LIST } from '../config/games'
import { getBestScore } from '../utils/storage'
import GameCard from '../components/GameCard'

const quickActions = [
  { to: '/blitz-mix', icon: Zap, label: 'Blitz Mix', color: '#ffd166' },
  { to: '/daily-challenge', icon: Flame, label: 'Daily', color: '#ff5e3a' },
  { to: '/multiplayer', icon: Swords, label: 'Battle', color: '#1B998B' },
  { to: '/profile', icon: User, label: 'Profile', color: '#8E44AD' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function GameArcade() {
  const navigate = useNavigate()
  const featured = GAME_LIST[0]
  const featuredBest = getBestScore(featured.id)

  return (
    <div style={{ minHeight: '100vh', padding: '1.25rem 1rem 5rem' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
      >
        {/* Header with arcade marquee feel */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              fontSize: '0.65rem', color: '#ffd166', textTransform: 'uppercase',
              letterSpacing: 4, fontWeight: 800, marginBottom: '0.3rem',
            }}
          >
            ◆ THE ARCADE ◆
          </motion.div>
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900, margin: '0 0 0.3rem',
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #ff9933, #ffd166)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Choose Your Game
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem', letterSpacing: 1 }}>
            Six games. One festival.
          </p>

          {/* Quick action pills */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem',
          }}>
            {quickActions.map(({ to, icon: Icon, label, color }) => (
              <motion.button
                key={to}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(to)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  color: '#fff', fontSize: '0.78rem', fontWeight: 700,
                  padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                  background: `${color}18`, border: `1px solid ${color}40`,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                <Icon size={13} style={{ color }} />
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Featured Game — big arcade marquee */}
        <motion.div variants={itemVariants}>
          <div style={{
            fontSize: '0.62rem', color: '#ffd166', textTransform: 'uppercase',
            letterSpacing: 3, fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            <Star size={14} style={{ color: '#ffd166' }} /> FEATURED
          </div>
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/game/${featured.route.split('/').pop()}/detail`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(featured.route) }}
            style={{
              background: featured.gradient,
              borderRadius: 'var(--radius-xl)',
              padding: '2rem 2rem',
              display: 'flex', alignItems: 'center', gap: '1.5rem',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {/* Glossy sheen */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(165deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 30%, transparent 55%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              fontSize: '3.5rem', flexShrink: 0,
              width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-xl)',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 8px 20px rgba(0,0,0,0.3)',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
              position: 'relative', zIndex: 1,
              overflow: 'hidden',
            }}>
              {featured.image ? (
                <img
                  src={featured.image}
                  alt={featured.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
                />
              ) : (
                <LogoSquare size={72} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
              <h2 style={{
                fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '0 0 0.2rem',
                fontFamily: 'var(--font-display)',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {featured.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 0.75rem', fontSize: '0.88rem' }}>
                {featured.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {featuredBest > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700,
                  }}>
                    <Trophy size={13} /> Best: {featuredBest.toLocaleString()}
                  </div>
                )}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.5rem 1.2rem', borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.4)',
                  color: '#fff', fontWeight: 800, fontSize: '0.85rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                }}>
                  <Play size={14} fill="#fff" /> PLAY NOW
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* All Games Grid — arcade cabinet style */}
        <motion.div variants={itemVariants}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,209,102,0.3), transparent)' }} />
            <span style={{
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
              letterSpacing: 3, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              ALL GAMES
            </span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,209,102,0.3), transparent)' }} />
          </div>

          <div className="arcade-grid">
            {GAME_LIST.map((game) => {
              const best = getBestScore(game.id)
              return (
                <motion.div key={game.id} variants={itemVariants}>
                  <GameCard
                    title={game.name}
                    description={game.description}
                    image={game.image}
                    gradient={game.gradient}
                    color={game.color}
                    bestScore={best}
                    multiplayer={game.multiplayerSupported}
                    onClick={() => navigate(`/game/${game.id}/detail`)}
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .arcade-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .arcade-grid { grid-template-columns: repeat(2, 1fr); gap: 0.85rem; }
        }
        @media (max-width: 420px) {
          .arcade-grid { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
        }
      `}</style>
    </div>
  )
}
