import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Swords, Flame, Trophy, Sparkles } from 'lucide-react'
import { LogoSquare } from '../components/Logo'

export default function Home({ player }) {
  const navigate = useNavigate()

  const handlePlayNow = () => {
    if (!player) {
      navigate('/player')
    } else {
      navigate('/games')
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem 3.5rem',
        boxSizing: 'border-box',
        overflowX: 'clip',
      }}
    >
      {/* Ambient festive aura background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 65% 55% at 50% 32%, rgba(255,153,51,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 20% 80%, rgba(255,209,102,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 80% 80%, rgba(139,69,219,0.12) 0%, transparent 60%)
          `,
        }}
      />

      {/* Main Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 520,
          padding: '0 0.5rem',
        }}
      >
        {/* Decorative rotating aura ring + Sacred Ganesha Emblem */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          {/* Rotating particle ring */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 190,
              height: 190,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '1px solid rgba(255, 209, 102, 0.2)',
                position: 'relative',
              }}
            >
              {[0, 90, 180, 270].map((deg, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: i % 2 === 0 ? '#ffd166' : '#ff9933',
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${deg}deg) translateY(-95px) translate(-50%, -50%)`,
                    boxShadow: '0 0 10px #ffd166',
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Emblem Icon (Single, cleanly framed without duplicate text) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120, delay: 0.15 }}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 0 30px rgba(255,153,51,0.5))',
            }}
          >
            <LogoSquare size={110} animate={true} />
          </motion.div>
        </div>

        {/* Arcade Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{
            fontSize: 'clamp(2.4rem, 7.5vw, 3.6rem)',
            fontWeight: 900,
            margin: '0 0 0.25rem',
            fontFamily: 'var(--font-display, inherit)',
            background: 'linear-gradient(135deg, #ff9933 0%, #ffd166 50%, #ff9933 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.08,
            letterSpacing: '-0.5px',
          }}
        >
          GANPATI BLITZ
        </motion.h1>

        {/* Short Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            fontSize: 'clamp(0.85rem, 2.8vw, 1.05rem)',
            fontWeight: 800,
            color: 'rgba(255, 209, 102, 0.92)',
            margin: '0 0 1.75rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Play. Compete. Celebrate.
        </motion.p>

        {/* PRIMARY CTA: PLAY NOW */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          style={{ width: '100%', maxWidth: 360, marginBottom: '1.25rem' }}
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={handlePlayNow}
            style={{
              width: '100%',
              padding: '1.15rem 2rem',
              fontSize: '1.25rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display, inherit)',
              letterSpacing: '0.08em',
              color: '#1a0800',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FFA834 50%, #FFD166 100%)',
              border: '2px solid #FFE082',
              borderRadius: 'var(--radius-xl, 20px)',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 209, 102, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top glossy sheen */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '45%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }}
            />
            <Play size={22} fill="#1a0800" style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>PLAY NOW</span>
          </motion.button>
        </motion.div>

        {/* SECONDARY ACTIONS ROW */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.65rem',
            width: '100%',
            maxWidth: 440,
            marginBottom: '2rem',
          }}
        >
          {/* Play with Friends */}
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/multiplayer')}
            style={styles.secondaryBtn}
          >
            <Swords size={17} color="#38BDF8" />
            <span>Play with Friends</span>
          </motion.button>

          {/* Daily Challenge */}
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/daily-challenge')}
            style={styles.secondaryBtn}
          >
            <Flame size={17} color="#FF5E3A" />
            <span>Daily Challenge</span>
          </motion.button>

          {/* Global Leaderboard */}
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/leaderboard')}
            style={styles.secondaryBtn}
          >
            <Trophy size={17} color="#FFD700" />
            <span>Leaderboard</span>
          </motion.button>
        </motion.div>

        {/* Small Supporting Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-muted, #9CA3AF)',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          <Sparkles size={14} color="#FFD166" />
          <span>6 Mini-Games • Universal Competitive Ranking</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

const styles = {
  secondaryBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.75rem 0.5rem',
    borderRadius: 'var(--radius-lg, 14px)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    color: '#F3F4F6',
    fontSize: '0.78rem',
    fontWeight: 700,
    fontFamily: 'var(--font-sans, inherit)',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: 'background 0.2s, border-color 0.2s',
  },
}
