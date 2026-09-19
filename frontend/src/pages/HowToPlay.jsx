import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Clock, MousePointerClick, Lightbulb } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const modakTypes = [
  {
    emoji: '🍬',
    name: 'Normal Modak',
    points: '+10 points',
    color: 'var(--primary)',
    bgColor: 'rgba(255, 107, 53, 0.12)',
    borderColor: 'rgba(255, 107, 53, 0.3)',
    desc: 'The classic sweet modak. Collect as many as you can!',
  },
  {
    emoji: '✨',
    name: 'Golden Modak',
    points: '+30 points',
    color: 'var(--secondary)',
    bgColor: 'rgba(255, 215, 0, 0.12)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    desc: 'Rare and valuable! Spots appear less often but score big.',
  },
  {
    emoji: '🔥',
    name: 'Burnt Modak',
    points: '-15 points',
    color: 'var(--burnt)',
    bgColor: 'rgba(255, 99, 71, 0.12)',
    borderColor: 'rgba(255, 99, 71, 0.3)',
    desc: 'Careful! These burnt modaks will cost you points and reset your combo.',
  },
  {
    emoji: '💣',
    name: 'Danger',
    points: '-25 points',
    color: 'var(--danger)',
    bgColor: 'rgba(255, 68, 68, 0.12)',
    borderColor: 'rgba(255, 68, 68, 0.3)',
    desc: 'Avoid at all costs! The biggest point penalty in the game.',
  },
]

const tips = [
  'Build combos for bonus points! 3+ consecutive hits increase your multiplier.',
  'Golden modaks are rare but worth it! Prioritize them when they appear.',
  'Difficulty increases over time — spawn rate and speed both ramp up.',
  'Missing a modak is okay — no penalty for letting it pass.',
]

export default function HowToPlay() {
  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '2rem 1rem 4rem' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Header */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.5rem' }}>
            🍬 MODAK RUSH - How to Play
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
            Everything you need to know before playing
          </p>
        </motion.div>

        {/* Objective */}
        <motion.div variants={itemVariants} className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', margin: '0 0 0.75rem' }}>
            <Target size={20} style={{ color: 'var(--primary)' }} />
            Objective
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
            Collect valid modaks before time runs out! Click or tap on modaks as they fall
            to score points. Avoid burnt modaks and danger items that drain your score.
            Build combos by collecting modaks consecutively to multiply your points!
          </p>
        </motion.div>

        {/* Modak Types */}
        <motion.div variants={itemVariants}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem', textAlign: 'center' }}>
            Modak Types
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {modakTypes.map((modak) => (
              <motion.div
                key={modak.name}
                whileHover={{ y: -2, scale: 1.01 }}
                className="card"
                style={{
                  padding: '1.25rem',
                  borderColor: modak.borderColor,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{
                        fontSize: '2rem',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: modak.bgColor,
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${modak.borderColor}`,
                      }}
                    >
                      {modak.emoji}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                        {modak.name}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: modak.color, fontFamily: 'var(--font-mono)' }}>
                        {modak.points}
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {modak.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div variants={itemVariants} className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', margin: '0 0 0.75rem' }}>
            <MousePointerClick size={20} style={{ color: 'var(--primary)' }} />
            Controls
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(15, 52, 96, 0.4)', borderRadius: 'var(--radius-md)' }}>
              <MousePointerClick size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>Click / Tap</strong> on modaks to collect them
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(15, 52, 96, 0.4)', borderRadius: 'var(--radius-md)' }}>
              <Clock size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>30 seconds</strong> timer — work fast!
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(15, 52, 96, 0.4)', borderRadius: 'var(--radius-md)' }}>
              <Zap size={16} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>Combo multiplier</strong> increases with consecutive hits (x1 → x1.5 → x2 → x3)
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div variants={itemVariants} className="card" style={{ padding: '1.5rem', borderColor: 'rgba(255, 215, 0, 0.2)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', margin: '0 0 0.75rem' }}>
            <Lightbulb size={20} style={{ color: 'var(--secondary)' }} />
            Tips & Strategy
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(15, 52, 96, 0.3)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  {i + 1}.
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Difficulty */}
        <motion.div variants={itemVariants} className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', margin: '0 0 0.75rem' }}>
            <Zap size={20} style={{ color: 'var(--burnt)' }} />
            Difficulty Scaling
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
            The game gets harder as time progresses. More modaks spawn faster, they move
            quicker, and dangerous items appear more frequently. Stay sharp in the final
            seconds!
          </p>
        </motion.div>

        {/* Back button */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text)',
                background: 'transparent',
                border: '2px solid var(--text-muted)',
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ArrowLeft size={18} />
              Back to Home
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

function Target({ size = 24, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
