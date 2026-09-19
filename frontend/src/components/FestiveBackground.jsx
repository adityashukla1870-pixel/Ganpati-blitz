import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const DIYAS = [
  { left: '6%', size: 26, delay: 0, duration: 9 },
  { left: '18%', size: 18, delay: 1.4, duration: 11 },
  { left: '32%', size: 22, delay: 0.6, duration: 8 },
  { left: '48%', size: 16, delay: 2.1, duration: 10 },
  { left: '62%', size: 24, delay: 0.3, duration: 9.5 },
  { left: '76%', size: 18, delay: 1.8, duration: 12 },
  { left: '90%', size: 22, delay: 0.9, duration: 8.5 },
]

const PETALS = [
  { left: '12%', delay: 0, duration: 14 },
  { left: '28%', delay: 3, duration: 16 },
  { left: '44%', delay: 6, duration: 13 },
  { left: '58%', delay: 2, duration: 17 },
  { left: '72%', delay: 5, duration: 15 },
  { left: '86%', delay: 8, duration: 14 },
]

/**
 * Sits behind the whole app: slow-moving light rays, floating diya flames and
 * drifting petals/sparkles. Purely decorative — aria-hidden, pointer-events none,
 * and reduces to a static gradient when the user prefers reduced motion.
 */
export default function FestiveBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  return (
    <div className="festive-bg" aria-hidden="true">
      {/* Slow light rays from the top, like temple lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140%',
          height: '70%',
          background:
            'conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(255,209,102,0.05) 8deg, transparent 16deg, transparent 40deg, rgba(255,153,51,0.05) 48deg, transparent 56deg, transparent 100deg, rgba(255,209,102,0.04) 108deg, transparent 116deg)',
          opacity: 0.8,
        }}
      />

      {!reducedMotion && (
        <>
          {DIYAS.map((d, i) => (
            <motion.div
              key={`diya-${i}`}
              animate={{ y: [0, -14, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: d.duration, repeat: Infinity, ease: 'easeInOut', delay: d.delay }}
              style={{
                position: 'absolute',
                left: d.left,
                bottom: '4%',
                fontSize: d.size,
                filter: 'drop-shadow(0 0 10px rgba(255,153,51,0.55))',
              }}
            >
              🪔
            </motion.div>
          ))}

          {PETALS.map((p, i) => (
            <motion.div
              key={`petal-${i}`}
              initial={{ y: '-10%', opacity: 0 }}
              animate={{ y: '110%', opacity: [0, 0.7, 0.7, 0] }}
              transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay }}
              style={{
                position: 'absolute',
                left: p.left,
                fontSize: 14,
                color: 'var(--festival-gold)',
              }}
            >
              ✦
            </motion.div>
          ))}
        </>
      )}
    </div>
  )
}
