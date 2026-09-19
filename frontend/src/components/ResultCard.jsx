import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, Home, Star, Flame, Zap, ShieldOff, Target, Gamepad2, Sparkles, Circle } from 'lucide-react'
import Button from './Button'
import { Link } from 'react-router-dom'

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  delay: (i % 6) * 0.08,
  icon: [Sparkles, Star, Flame, Circle][i % 4],
  duration: 1.6 + (i % 5) * 0.2,
}))

export default function ResultCard({
  score = 0,
  isPersonalBest = false,
  previousBest = 0,
  gameStats = {},
}) {
  const {
    modaksCollected = 0,
    goldenCollected = 0,
    burntCollected = 0,
    dangerHit = 0,
    maxCombo = 0,
  } = gameStats

  const statItems = [
    { label: 'Modaks Collected', value: modaksCollected, icon: <Target size={16} />, color: 'var(--primary)' },
    { label: 'Golden Modaks', value: goldenCollected, icon: <Star size={16} />, color: 'var(--secondary)' },
    { label: 'Burnt Modaks', value: burntCollected, icon: <Flame size={16} />, color: 'var(--burnt)' },
    { label: 'Danger Hits', value: dangerHit, icon: <ShieldOff size={16} />, color: 'var(--danger)' },
    { label: 'Max Combo', value: `x${maxCombo}`, icon: <Zap size={16} />, color: 'var(--accent)' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card card-ornate"
      style={{
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 50% 30%, rgba(255, 209, 102, 0.14) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Confetti burst for a new personal best */}
      {isPersonalBest && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <motion.span
              key={i}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 240, opacity: [0, 1, 1, 0], rotate: 200 }}
              transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
              style={{ position: 'absolute', left: c.left, top: 0, fontSize: '1.1rem' }}
            >
              {c.emoji}
            </motion.span>
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 16 }}
        style={{ fontSize: '2.5rem', marginBottom: '0.25rem', filter: 'drop-shadow(0 0 16px rgba(255,209,102,0.5))' }}
      >
        {isPersonalBest ? <Trophy size={40} fill="var(--secondary)" /> : <Gamepad2 size={40} style={{ color: 'var(--primary)' }} />}
      </motion.div>

      {/* Score */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
          Final Score
        </div>
        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: 'var(--secondary)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            textShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
          }}
        >
          {score.toLocaleString()}
        </div>
      </motion.div>

      {/* Personal Best Banner */}
      <AnimatePresence>
        {isPersonalBest && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 107, 53, 0.2))',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--secondary)',
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
              style={{ display: 'inline-block' }}
            >
              <Sparkles size={18} style={{ color: 'var(--secondary)', display: 'inline-block', marginRight: '0.4rem' }} /> NEW PERSONAL BEST!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Best */}
      {!isPersonalBest && previousBest > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Previous Best: <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{previousBest.toLocaleString()}</span>
        </div>
      )}

      {/* Divider */}
      <div className="divider divider-gold" style={{ margin: '1.5rem 0' }} />

      {/* Stats Breakdown */}
      <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', textAlign: 'center' }}>
          Game Stats
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {statItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                background: 'rgba(15, 52, 96, 0.4)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: item.color }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                {item.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/game/modak-rush" style={{ textDecoration: 'none' }}>
          <Button variant="play" icon={<RotateCcw size={16} />}>
            Play Again
          </Button>
        </Link>
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" icon={<Gamepad2 size={16} />}>
            Game Hub
          </Button>
        </Link>
        <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
          <Button variant="gold" icon={<Trophy size={16} />}>
            Leaderboard
          </Button>
        </Link>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" icon={<Home size={16} />}>
            Home
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
