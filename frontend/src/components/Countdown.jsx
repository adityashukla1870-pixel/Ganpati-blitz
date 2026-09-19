import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const numberColors = {
  3: 'var(--danger)',
  2: '#ff8c00',
  1: 'var(--secondary)',
}

const numberLabels = {
  3: '3',
  2: '2',
  1: '1',
}

export default function Countdown({ onComplete, duration = 3 }) {
  const [current, setCurrent] = useState(duration)
  const [isGo, setIsGo] = useState(false)

  useEffect(() => {
    if (current <= 0) {
      setIsGo(true)
      const goTimer = setTimeout(() => {
        onComplete?.()
      }, 800)
      return () => clearTimeout(goTimer)
    }

    const timer = setTimeout(() => {
      setCurrent((c) => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [current, onComplete])

  const color = isGo ? 'var(--success)' : numberColors[current] || 'var(--primary)'
  const label = isGo ? 'GO!' : numberLabels[current] || ''

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="countdown-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 200,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isGo ? 'go' : current}
          initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 2, rotate: 10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: isGo ? '5rem' : '8rem',
            fontWeight: 900,
            color,
            textShadow: `0 0 40px ${color}, 0 0 80px ${color}66`,
            lineHeight: 1,
            fontFamily: 'var(--font-sans)',
            userSelect: 'none',
          }}
        >
          {label}
        </motion.div>
      </AnimatePresence>

      {/* Ripple rings */}
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.2, delay, ease: 'easeOut', repeat: current > 0 || isGo ? Infinity : 0, repeatDelay: 0.5 }}
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </motion.div>
  )
}
