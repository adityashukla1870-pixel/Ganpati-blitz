import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { Flame } from 'lucide-react'

export default function ComboDisplay({ combo = 0, isActive = false }) {
  const [displayCombo, setDisplayCombo] = useState(combo)
  const [animKey, setAnimKey] = useState(0)
  const [isReset, setIsReset] = useState(false)
  const prevCombo = useRef(combo)

  useEffect(() => {
    if (combo !== prevCombo.current) {
      if (combo > prevCombo.current) {
        setDisplayCombo(combo)
        setAnimKey((k) => k + 1)
        setIsReset(false)
      } else if (combo === 0) {
        setIsReset(true)
        setTimeout(() => {
          setDisplayCombo(0)
          setIsReset(false)
        }, 500)
      } else {
        setDisplayCombo(combo)
        setAnimKey((k) => k + 1)
      }
      prevCombo.current = combo
    }
  }, [combo])

  if (!isActive || combo === 0) return null

  const comboScale = Math.min(1 + combo * 0.03, 1.6)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animKey}
        initial={{ opacity: 0, scale: 0.7, y: 10 }}
        animate={{
          opacity: isReset ? 0.4 : 1,
          scale: isReset ? 0.8 : comboScale,
          y: 0,
          x: isReset ? [0, -4, 4, -4, 4, 0] : 0,
        }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{
          duration: isReset ? 0.4 : 0.3,
          ease: 'easeOut',
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.3rem 0.85rem',
          background: combo >= 10
            ? 'linear-gradient(135deg, #ff4500, #ff8c00)'
            : combo >= 5
              ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.3), rgba(255, 140, 0, 0.3))'
              : 'rgba(255, 107, 53, 0.2)',
          borderRadius: 'var(--radius-full)',
          border: `1px solid ${combo >= 10 ? 'rgba(255, 69, 0, 0.6)' : 'rgba(255, 107, 53, 0.3)'}`,
          boxShadow: combo >= 5
            ? '0 0 15px rgba(255, 107, 53, 0.3), 0 0 30px rgba(255, 107, 53, 0.1)'
            : '0 0 8px rgba(255, 107, 53, 0.15)',
        }}
      >
        <motion.span
          animate={
            !isReset
              ? { rotate: [0, -10, 10, -10, 0] }
              : {}
          }
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ fontSize: '1rem', lineHeight: 1 }}
        >
          <Flame size={18} style={{ color: 'var(--danger)' }} />
        </motion.span>
        <span
          style={{
            fontSize: `${0.75 + combo * 0.01}rem`,
            fontWeight: 900,
            color: combo >= 10 ? '#fff' : 'var(--primary)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.5px',
          }}
        >
          COMBO x{combo}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
