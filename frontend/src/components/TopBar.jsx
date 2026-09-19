import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, User, Settings } from 'lucide-react';
import { getSoundEnabled, setSoundEnabled } from '../utils/storage';
import { LogoIcon } from '../components/Logo';

const TopBar = ({ player, onSoundToggle, soundEnabled }) => {
  const navigate = useNavigate();

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    onSoundToggle(newState);
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={styles.bar}
    >
      <div style={styles.left} onClick={() => navigate('/')}>
        <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogoIcon size={28} />
        </div>
        <span style={styles.brand}>GANPATI BLITZ</span>
      </div>

      <div style={styles.right}>
        {player ? (
          <>
            <div style={styles.levelBadge}>
              <span style={styles.levelText}>Lv.{player.level}</span>
              <div style={styles.xpBarBg}>
                <div
                  style={{
                    ...styles.xpBarFill,
                    width: `${((player.xp || 0) / (player.xpNext || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <button style={styles.iconBtn} onClick={toggleSound} aria-label="Toggle sound">
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              style={styles.iconBtn}
              onClick={() => navigate('/settings')}
              aria-label="Profile or settings"
            >
              <User size={18} />
            </button>
          </>
        ) : (
          <button
            style={styles.joinBtn}
            onClick={() => navigate('/player')}
          >
            JOIN
          </button>
        )}
      </div>
    </motion.div>
  );
};

const styles = {
  bar: {
    position: 'fixed',
    top: 10,
    left: 12,
    right: 12,
    margin: '0 auto',
    maxWidth: 960,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: 'rgba(12,8,28,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,209,102,0.2)',
    borderRadius: 'var(--radius-xl, 20px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 12px rgba(255,209,102,0.08)',
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    userSelect: 'none',
  },
  icon: {
    fontSize: '1.4rem',
  },
  brand: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontWeight: 800,
    fontSize: '0.85rem',
    letterSpacing: '0.06em',
    background: 'linear-gradient(135deg, var(--festival-gold, #FFD166), var(--festival-saffron, #FF8C42))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,209,102,0.1)',
    borderRadius: 'var(--radius-full, 9999px)',
    padding: '4px 10px 4px 12px',
  },
  levelText: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--festival-gold, #FFD166)',
    whiteSpace: 'nowrap',
  },
  xpBarBg: {
    width: 48,
    height: 5,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
    background: 'linear-gradient(90deg, var(--festival-gold, #FFD166), var(--festival-saffron, #FF8C42))',
    transition: 'width 0.4s ease',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-full, 9999px)',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text, #EAEAEA)',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  joinBtn: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
    padding: '6px 18px',
    borderRadius: 'var(--radius-full, 9999px)',
    border: '1px solid var(--festival-gold, #FFD166)',
    background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
    color: '#0C081C',
    cursor: 'pointer',
  },
};

export default TopBar;
