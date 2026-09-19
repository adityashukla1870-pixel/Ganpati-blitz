import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Users, Circle } from 'lucide-react';
import { getGame } from '../config/games';
import { getBestScore, getPlayer } from '../utils/storage';
import { LogoSquare } from '../components/Logo';
import DifficultySelector from '../components/DifficultySelector';
import { getSelectedDifficulty, setSelectedDifficulty, getTierBestScore } from '../utils/progression';
import { useState } from 'react';

const instructions = {
  'modak-rush': 'Collect falling modaks! Tap golden stars for bonus, avoid fire and poop. 30 seconds!',
  'diya-dash': 'Watch the diya sequence light up, then repeat it! Each level adds one more. How far can you go?',
  'dhol-battle': 'Hit the beats as they reach the target zone! Time your taps for PERFECT scores!',
  'rangoli-rush': 'Find the missing piece of the rangoli pattern! Choose the correct shape from four options.',
  'mushak-maze': 'Guide the mouse through the maze to reach the candy! Collect stars and avoid traps.',
  'ganpati-logic': 'Solve rapid-fire puzzles! Numbers, patterns, shapes — think fast!',
};

const controls = {
  'modak-rush': 'Tap falling objects',
  'diya-dash': 'Tap diyas in sequence',
  'dhol-battle': 'Tap buttons / Press D F J K',
  'rangoli-rush': 'Tap the correct piece',
  'mushak-maze': 'D-pad or Arrow Keys',
  'ganpati-logic': 'Tap your answer',
};

const difficulty = {
  'modak-rush': 'Medium',
  'diya-dash': 'Medium',
  'dhol-battle': 'Hard',
  'rangoli-rush': 'Easy',
  'mushak-maze': 'Medium',
  'ganpati-logic': 'Medium',
};

const diffColor = {
  Easy: '#4ADE80',
  Medium: '#FBBF24',
  Hard: '#F87171',
};

const dots = (level) => {
  const map = { Easy: 1, Medium: 2, Hard: 3 };
  const n = map[level] || 2;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3].map((i) => (
        <Circle
          key={i}
          size={8}
          style={{
            color: i <= n ? diffColor[level] : 'rgba(255,255,255,0.1)',
            fill: i <= n ? diffColor[level] : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
};

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = getGame(gameId);
  const bestScore = getBestScore(gameId) || 0;
  const player = getPlayer();
  const [selectedTier, setSelectedTier] = useState(() => getSelectedDifficulty(gameId));
  const tierBest = getTierBestScore(gameId, selectedTier);

  const handleTierChange = (newTier) => {
    setSelectedTier(newTier);
    setSelectedDifficulty(gameId, newTier);
  };

  if (!game) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#EAEAEA', fontFamily: 'var(--font-sans)' }}>Game not found.</p>
        <button style={styles.backBtn} onClick={() => navigate('/games')}>
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
    );
  }

  const gamesPlayed = player?.gamesPlayed?.[gameId] || 0;

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/games')}>
        <ArrowLeft size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={styles.hero}
      >
        <div
          style={{
            ...styles.iconBg,
            background: game.gradient || 'linear-gradient(135deg, var(--festival-saffron), var(--festival-gold))',
            overflow: 'hidden',
          }}
        >
          {game.image ? (
            <img
              src={game.image}
              alt={game.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
            />
          ) : (
            <LogoSquare size={96} />
          )}
        </div>
        <h1 style={styles.title}>{game.name || game.title || gameId}</h1>
        <p style={styles.desc}>{game.description || 'A festive arcade game!'}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={styles.card}
      >
        <h3 style={styles.cardTitle}>HOW TO PLAY</h3>
        <p style={styles.cardBody}>{instructions[gameId] || 'Play and have fun!'}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={styles.card}
      >
        <h3 style={styles.cardTitle}>CONTROLS</h3>
        <p style={styles.cardBody}>{controls[gameId] || 'Tap to play'}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ ...styles.card, width: '100%' }}
      >
        <h3 style={styles.cardTitle}>DIFFICULTY & PROGRESSION</h3>
        <DifficultySelector
          gameId={gameId}
          selectedTier={selectedTier}
          onChange={handleTierChange}
          showDescription={true}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.30 }}
        style={styles.statsRow}
      >
        <div style={styles.stat}>
          <span style={styles.statValue}>{tierBest > 0 ? tierBest : bestScore}</span>
          <span style={styles.statLabel}>{tierBest > 0 ? `${selectedTier.toUpperCase()} Best` : 'Overall Best'}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{gamesPlayed}</span>
          <span style={styles.statLabel}>Games Played</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{bestScore}</span>
          <span style={styles.statLabel}>Personal Best</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={styles.actions}
      >
        <button style={styles.soloBtn} onClick={() => navigate(`/game/${gameId}?diff=${selectedTier}`)}>
          <Play size={20} />
          SOLO PLAY ({selectedTier.toUpperCase()})
        </button>
        <button style={styles.multiBtn} onClick={() => navigate(`/multiplayer?game=${gameId}`)}>
          <Users size={18} />
          MULTIPLAYER
        </button>
      </motion.div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--festival-navy, #0C081C)',
    padding: '80px 16px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    boxSizing: 'border-box',
  },
  backBtn: {
    position: 'fixed',
    top: 76,
    left: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text, #EAEAEA)',
    cursor: 'pointer',
    zIndex: 100,
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    maxWidth: 480,
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  title: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text, #EAEAEA)',
    margin: 0,
  },
  desc: {
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.9rem',
    color: 'var(--text-muted, #999)',
    margin: 0,
    lineHeight: 1.5,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--card, rgba(255,255,255,0.04))',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    boxSizing: 'border-box',
  },
  cardTitle: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--festival-gold, #FFD166)',
    margin: '0 0 10px',
  },
  cardBody: {
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.9rem',
    color: 'var(--text, #EAEAEA)',
    margin: 0,
    lineHeight: 1.6,
  },
  statsRow: {
    display: 'flex',
    width: '100%',
    maxWidth: 480,
    gap: 12,
  },
  stat: {
    flex: 1,
    background: 'var(--card, rgba(255,255,255,0.04))',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
    borderRadius: 'var(--radius-lg)',
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  statValue: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--text, #EAEAEA)',
  },
  statLabel: {
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.7rem',
    letterSpacing: '0.05em',
    color: 'var(--text-muted, #999)',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  diffBadge: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  actions: {
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
  },
  soloBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '16px 0',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
    color: '#0C081C',
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '1rem',
    fontWeight: 800,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(255,140,66,0.35)',
  },
  multiBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '14px 0',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text, #EAEAEA)',
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '0.9rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
  },
};

export default GameDetail;
