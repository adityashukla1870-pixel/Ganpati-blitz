import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { LogoFull } from '../components/Logo'

const PARTICLE_POSITIONS = [
  { left: '15%', top: '20%', size: 4, opacity: 0.6, duration: 2.5, delay: 0 },
  { left: '85%', top: '18%', size: 6, opacity: 0.7, duration: 3.2, delay: 0.4 },
  { left: '25%', top: '75%', size: 5, opacity: 0.5, duration: 2.8, delay: 0.8 },
  { left: '75%', top: '80%', size: 4, opacity: 0.8, duration: 3.0, delay: 0.2 },
  { left: '50%', top: '15%', size: 5, opacity: 0.6, duration: 2.2, delay: 0.6 },
  { left: '10%', top: '60%', size: 6, opacity: 0.5, duration: 3.5, delay: 1.0 },
  { left: '90%', top: '55%', size: 4, opacity: 0.7, duration: 2.7, delay: 0.5 },
  { left: '60%', top: '88%', size: 5, opacity: 0.6, duration: 3.1, delay: 0.9 },
]

export default function SplashScreen({ onComplete }) {
  const [muted, setMuted] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  const spring = reducedMotion
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 200, damping: 14 }

  const fade = (delay = 0) =>
    reducedMotion
      ? { opacity: 1 }
      : { opacity: 0 }

  const fadeAnim = (delay = 0) =>
    reducedMotion
      ? { opacity: 1 }
      : { opacity: 0, y: 12 }

  // Compute responsive logo size
  const logoSize = Math.max(100, Math.min(140, window.innerWidth * 0.25))

  return (
    <div
      onClick={handleStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleStart()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,153,51,0.12) 0%, rgba(255,94,58,0.06) 30%, transparent 65%), ' +
          'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(74,26,107,0.25) 0%, transparent 60%), ' +
          'radial-gradient(ellipse 50% 40% at 80% 70%, rgba(255,209,102,0.08) 0%, transparent 50%), ' +
          '#0a0a1a',
        overflow: 'hidden',
        cursor: showButton ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Animated sparkle particles */}
      {!reducedMotion && PARTICLE_POSITIONS.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          animate={{ opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.3], scale: [0.6, 1.2, 0.6] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,209,102,${p.opacity}) 0%, rgba(255,153,51,${p.opacity * 0.5}) 60%, transparent 100%)`,
            pointerEvents: 'none',
            filter: `blur(${p.size > 5 ? 1 : 0}px)`,
          }}
        />
      ))}

      {/* Sound toggle */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            setMuted((m) => !m)
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted, #a0a0b0)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
          }}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </motion.button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          position: 'relative',
          zIndex: 10,
          padding: '0 1.5rem',
          maxWidth: 480,
          width: '100%',
        }}
      >
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            reducedMotion
              ? { duration: 0.01 }
              : { type: 'spring', stiffness: 180, damping: 12, delay: 0.2 }
          }
          style={{
            fontSize: 'clamp(4rem, 15vw, 7rem)',
            lineHeight: 1,
            filter: 'drop-shadow(0 0 30px rgba(255,209,102,0.5))',
          }}
        >
          <LogoFull size={logoSize} animate={true} />
        </motion.div>

        <motion.h1
          initial={fadeAnim(0)}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.01 }
              : { duration: 0.8, delay: 0.7, ease: 'easeOut' }
          }
          style={{
            fontFamily: 'var(--font-display, "Baloo 2", sans-serif)',
            fontSize: 'clamp(2rem, 8vw, 3.2rem)',
            fontWeight: 900,
            letterSpacing: '2px',
            textAlign: 'center',
            lineHeight: 1.1,
            margin: 0,
            background:
              'linear-gradient(135deg, #ff9933 0%, #ffd166 45%, #ff9933 70%, #ffd166 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 2px 12px rgba(255,209,102,0.35))',
          }}
        >
          GANPATI BLITZ
        </motion.h1>

        <motion.p
          initial={fadeAnim(0)}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.01 }
              : { duration: 0.8, delay: 1.0, ease: 'easeOut' }
          }
          style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)',
            color: 'var(--text-muted, #a0a0b0)',
            textAlign: 'center',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Play. Compete. Celebrate.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reducedMotion
              ? { duration: 0.01 }
              : { duration: 0.6, delay: 1.2 }
          }
          style={{
            width: 'min(220px, 60vw)',
            height: 4,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            marginTop: '0.25rem',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={
              reducedMotion
                ? { duration: 0.01 }
                : { duration: 1.4, delay: 0.5, ease: 'easeInOut' }
            }
            style={{
              height: '100%',
              borderRadius: 4,
              background:
                'linear-gradient(90deg, var(--festival-ember, #ff5e3a), var(--festival-gold, #ffd166), var(--festival-saffron, #ff9933))',
              boxShadow: '0 0 12px rgba(255,209,102,0.4)',
            }}
          />
        </motion.div>

        <AnimatePresence>
          {showButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }
              }
              whileHover={
                reducedMotion
                  ? {}
                  : { scale: 1.06, boxShadow: '0 0 50px rgba(255,153,51,0.6), 0 0 80px rgba(255,209,102,0.3)' }
              }
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                handleStart()
              }}
              style={{
                marginTop: '1rem',
                padding: '0.9rem 2.5rem',
                fontFamily: 'var(--font-display, "Baloo 2", sans-serif)',
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                border: '2px solid var(--festival-gold, #ffd166)',
                borderRadius: 'var(--radius-xl, 24px)',
                background:
                  'linear-gradient(135deg, var(--festival-ember, #ff5e3a) 0%, var(--festival-saffron, #ff9933) 55%, var(--festival-gold, #ffd166) 100%)',
                color: '#2a0f00',
                cursor: 'pointer',
                boxShadow:
                  '0 6px 28px rgba(255,94,58,0.45), 0 0 30px rgba(255,209,102,0.2)',
                animation: reducedMotion
                  ? 'none'
                  : 'splashPulse 2.2s ease-in-out infinite',
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)',
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
              />
              TAP TO START
            </motion.button>
          )}
        </AnimatePresence>

        {!reducedMotion && showButton && (
          <motion.p
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted, #a0a0b0)',
              letterSpacing: '1px',
              opacity: 0.4,
              textAlign: 'center',
            }}
          >
            Ganesh Chaturthi Special Edition
          </motion.p>
        )}
      </div>

      <style>{`
        @keyframes splashPulse {
          0%, 100% {
            box-shadow: 0 6px 28px rgba(255,94,58,0.45), 0 0 24px rgba(255,209,102,0.2);
          }
          50% {
            box-shadow: 0 8px 36px rgba(255,94,58,0.65), 0 0 50px rgba(255,209,102,0.45);
          }
        }
      `}</style>
    </div>
  )
}
