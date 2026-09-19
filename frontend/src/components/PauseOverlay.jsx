import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Volume2, VolumeX, HelpCircle, Home, Pause, X, Sliders } from 'lucide-react'
import { getGameInstructions } from '../config/gameInstructions'

export default function PauseOverlay({
  gameId,
  onResume,
  onRestart,
  onToggleSound,
  soundEnabled,
  onQuit,
}) {
  const [activeModal, setActiveModal] = useState(null) // null | 'instructions' | 'settings'
  const instructions = gameId ? getGameInstructions(gameId) : null

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (activeModal) {
          setActiveModal(null)
        } else {
          onResume()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onResume, activeModal])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onResume}
      style={styles.overlay}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={styles.panel}
      >
        {/* Header */}
        <div style={styles.header}>
          <Pause size={24} color="#FFD166" />
          <h2 style={styles.title}>GAME PAUSED</h2>
        </div>

        {/* Buttons List */}
        <div style={styles.btnList}>
          {/* RESUME */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onResume}
            style={styles.primaryBtn}
          >
            <Play size={18} fill="#0C081C" /> RESUME
          </motion.button>

          {/* RESTART */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            style={styles.secondaryBtn}
          >
            <RotateCcw size={17} /> RESTART
          </motion.button>

          {/* HOW TO PLAY */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal('instructions')}
            style={styles.secondaryBtn}
          >
            <HelpCircle size={17} /> HOW TO PLAY
          </motion.button>

          {/* SETTINGS / SOUND */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleSound}
            style={styles.secondaryBtn}
          >
            {soundEnabled ? <Volume2 size={17} color="#4ADE80" /> : <VolumeX size={17} color="#EF4444" />}
            <span>SOUND: {soundEnabled ? 'ON' : 'MUTED'}</span>
          </motion.button>

          {/* QUIT GAME */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onQuit}
            style={styles.dangerBtn}
          >
            <Home size={17} /> QUIT GAME
          </motion.button>
        </div>
      </motion.div>

      {/* Embedded How To Play Modal */}
      <AnimatePresence>
        {activeModal === 'instructions' && instructions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            style={styles.modal}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FFD166' }}>
                {instructions.title} Briefing
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={styles.closeBtn}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Objective
                </div>
                <div style={{ fontSize: '0.85rem', color: '#FFF', marginTop: '0.2rem' }}>
                  {instructions.objective}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Controls
                </div>
                <div style={{ fontSize: '0.82rem', color: '#38BDF8', marginTop: '0.2rem' }}>
                  💻 {instructions.controls.desktop}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#4ADE80', marginTop: '0.2rem' }}>
                  📱 {instructions.controls.mobile}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              style={styles.modalCloseAction}
            >
              Back to Pause Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(5, 5, 20, 0.88)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  panel: {
    maxWidth: 340,
    width: '100%',
    background: 'rgba(18, 12, 38, 0.95)',
    border: '2px solid rgba(255, 209, 102, 0.3)',
    borderRadius: 'var(--radius-xl, 20px)',
    padding: '1.75rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 20px rgba(255,209,102,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: '1.5rem',
  },
  title: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '1.35rem',
    fontWeight: 900,
    color: '#FFF',
    letterSpacing: '0.06em',
    margin: 0,
  },
  btnList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  primaryBtn: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-lg, 12px)',
    border: 'none',
    background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
    color: '#0C081C',
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '0.95rem',
    fontWeight: 900,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 15px rgba(255,140,66,0.4)',
  },
  secondaryBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg, 12px)',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.06)',
    color: '#F1F5F9',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.88rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg, 12px)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#FCA5A5',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.88rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: '0.25rem',
  },
  modal: {
    position: 'absolute',
    maxWidth: 380,
    width: '90%',
    background: 'rgba(18, 12, 38, 0.98)',
    border: '2px solid rgba(255, 209, 102, 0.4)',
    borderRadius: 'var(--radius-xl, 18px)',
    padding: '1.5rem',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
    zIndex: 10001,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalCloseAction: {
    marginTop: '1.25rem',
    width: '100%',
    padding: '0.65rem',
    borderRadius: 'var(--radius-md, 8px)',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#FFF',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
}
