import { motion } from 'framer-motion'

function getTimerColor(ratio) {
  if (ratio > 0.5) return 'var(--success)'
  if (ratio > 0.25) return 'var(--secondary)'
  return 'var(--danger)'
}

export default function Timer({ timeRemaining = 0, totalTime = 30, isRunning = false }) {
  const ratio = totalTime > 0 ? timeRemaining / totalTime : 0
  const color = getTimerColor(ratio)
  const displayTime = Math.max(0, timeRemaining).toFixed(1)
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = Math.floor(timeRemaining % 60)
  const tenths = Math.floor((timeRemaining * 10) % 10)

  const circumference = 2 * Math.PI * 42
  const offset = circumference * (1 - ratio)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        {/* Background ring */}
        <svg
          width="56"
          height="56"
          viewBox="0 0 100 100"
          style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1,
            }}
          >
            {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}`}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            textShadow: `0 0 10px ${color}33`,
          }}
        >
          {displayTime}s
        </span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Time Left
        </span>
      </div>

      {isRunning && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      )}
    </div>
  )
}
