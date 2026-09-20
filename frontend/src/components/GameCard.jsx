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
        background: 'rgba(16, 12, 34, 0.92)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex', flexDirection: 'column',
        minHeight: 220,
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: gradient || color, zIndex: 4,
        }} />

        {/* Big Artwork Area with Overlay Play Disc */}
        <div style={{
          position: 'relative', width: '100%', height: 140,
          overflow: 'hidden', background: 'rgba(0,0,0,0.5)',
        }}>
          {image ? (
            <img
              src={image}
              alt={title}
              className="cabinet-img"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block', transition: 'transform 0.4s ease',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: gradient || color,
            }}>
              <LogoSquare size={54} />
            </div>
          )}

          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 45%, rgba(16, 12, 34, 0.95) 100%)',
            pointerEvents: 'none', zIndex: 1,
          }} />

          {/* Multiplayer badge if supported */}
          {multiplayer && (
            <div style={{
              position: 'absolute', top: 10, right: 10, zIndex: 3,
              padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              fontSize: '0.65rem', color: '#FFF', fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}>
              <Swords size={11} /> 1v1
            </div>
          )}

          {/* Center Overlay Play Button */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2, pointerEvents: 'none',
          }}>
            <div className="cabinet-play-disc" style={{
              width: 48, height: 48, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255,140,66,0.6), 0 4px 12px rgba(0,0,0,0.5)',
              border: '2px solid rgba(255,255,255,0.6)',
              color: '#0C081C', transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}>
              <Play size={20} fill="#0C081C" style={{ marginLeft: 2 }} />
            </div>
          </div>
        </div>

        {/* Text content & bottom bar */}
        <div style={{
          padding: '0.85rem 1rem 0.95rem',
          display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1,
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{
              fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: '0 0 0.15rem',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.15,
            }}>
              {title}
            </h3>
            {description && (
              <p style={{
                fontSize: '0.78rem', color: 'var(--text-muted, #9CA3AF)', margin: 0,
                lineHeight: 1.35,
              }}>
                {description}
              </p>
            )}
          </div>

          {/* Bottom Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '0.4rem', paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div>
              {bestScore > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Trophy size={13} style={{ color: '#FFD166' }} />
                  <span style={{ fontSize: '0.92rem', color: '#FFD166', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {bestScore.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ready to play</span>
              )}
            </div>

            <span style={{
              fontSize: '0.75rem', fontWeight: 800, color: '#FFD166',
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            }}>
              PLAY <Play size={10} fill="#FFD166" />
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .arcade-cabinet:hover .cabinet-img { transform: scale(1.08); }
        .arcade-cabinet:hover .cabinet-play-disc { transform: scale(1.15); box-shadow: 0 0 30px rgba(255,209,102,0.8) !important; }
        .arcade-cabinet:hover > div { border-color: rgba(255,209,102,0.5); box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 25px rgba(255,153,51,0.3); }
      `}</style>
    </motion.button>
  )
}
