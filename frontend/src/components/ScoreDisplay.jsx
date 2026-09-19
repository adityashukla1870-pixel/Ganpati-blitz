import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

export default function ScoreDisplay({ score = 0, label = 'SCORE' }) {
  const [displayScore, setDisplayScore] = useState(score)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevScore = useRef(score)

  useEffect(() => {
    if (score !== prevScore.current) {
      setIsAnimating(true)
      // Animate counting up/down
      const diff = score - displayScore
      const steps = Math.min(Math.abs(diff), 10)
      const increment = diff / steps
      let current = displayScore
      let step = 0

      const interval = setInterval(() => {
        step++
        if (step >= steps) {
          current = score
          clearInterval(interval)
          setTimeout(() => setIsAnimating(false), 300)
        } else {
          current += increment
        }
        setDisplayScore(Math.round(current))
      }, 30)

      prevScore.current = score
      return () => clearInterval(interval)
    }
  }, [score])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
      <span
        style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {label}
      </span>
      <AnimatePresence mode="wait">
        <motion.div
          key="score"
          animate={{
            scale: isAnimating ? [1, 1.25, 1] : 1,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
          style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: 'var(--secondary)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
            minWidth: '80px',
            textAlign: 'center',
          }}
        >
          {displayScore.toLocaleString()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
