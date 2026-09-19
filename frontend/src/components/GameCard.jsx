import { motion } from 'framer-motion'
import { Play, Swords, Trophy, Star } from 'lucide-react'
import { LogoSquare } from '../components/Logo'

export default function GameCard({
  title,
  description,
  image,
  gradient,
  color = 'var(--festival-saffron)',
  bestScore,
  multiplayer = false,
  onClick,
  disabled = false,
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? {} : { y: -8, scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="arcade-cabinet"
      style={{
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        border: 'none',
        textAlign: 'left',
        width: '100%',
        padding: 0,
        font: 'inherit',
        color: 'inherit',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      {/* Main card body */}
      <div style={{
        position: 'relative',
        background: gradient || `linear-gradient(135deg, ${color}, #2a0f4e)`,
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem 1.25rem 1.25rem',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
        minHeight: 200,
        border: '2px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        {/* Glossy sheen overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(165deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 35%, transparent 60%)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Decorative corner glow */}
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 120, height: 120,
          background: `radial-gradient(circle, ${color}55, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Bottom glow on hover via CSS */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: `radial-gradient(ellipse at 50% 100%, ${color}30, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
          opacity: 0, transition: 'opacity 0.3s',
        }} className="cabinet-glow" />

        {/* Large icon area */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 62, height: 62, borderRadius: 18,
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            {image ? (
              <img
                src={image}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
              />
            ) : (
              <LogoSquare size={54} style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }} />
            )}
          </div>
        </div>

        {/* Text content */}
        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          <h3 style={{
            fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: '0 0 0.2rem',
            fontFamily: 'var(--font-display)',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            lineHeight: 1.1,
          }}>
            {title}
          </h3>
          {description && (
            <p style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', margin: 0,
              lineHeight: 1.35,
            }}>
              {description}
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '0.15rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {bestScore > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.7rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700,
              }}>
                <Trophy size={12} /> {bestScore.toLocaleString()}
              </span>
            )}
            {multiplayer && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
                fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600,
                padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.12)',
              }}>
                <Swords size={11} /> 1v1
              </span>
            )}
          </div>

          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#fff', fontWeight: 800, fontSize: '0.72rem',
              letterSpacing: 0.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Play size={11} fill="#fff" /> PLAY
          </motion.div>
        </div>
      </div>

      <style>{`
        .arcade-cabinet:hover .cabinet-glow { opacity: 1 !important; }
        .arcade-cabinet:hover > div { border-color: rgba(255,209,102,0.45); box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 30px var(--tile-glow, rgba(255,153,51,0.3)); }
      `}</style>
    </motion.button>
  )
}
