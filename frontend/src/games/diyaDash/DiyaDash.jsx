import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, Shield, AlertTriangle, RotateCcw, Flame, Pause } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Countdown from '../../components/Countdown';
import GameResult from '../shared/GameResult';
import DifficultySelector from '../../components/DifficultySelector';
import PauseOverlay from '../../components/PauseOverlay';
import { getBestScore, setBestScore, getSoundEnabled, setSoundEnabled, getPlayer } from '../../utils/storage';
import { getSelectedDifficulty, setSelectedDifficulty, recordGameResult, getTierBestScore } from '../../utils/progression';
import { DIFFICULTY_TIERS } from '../../config/difficulties';
import { submitScore } from '../../services/api';

const GRID_SIZE = 9;

// Indian Classical Swara Frequencies (Sa Re Ga Ma Pa Dha Ni Sa' Re')
const SWARA_FREQS = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];

const TIER_PARAMS = {
  easy: {
    showDelay: 700,
    pauseDelay: 320,
    lives: 2,
    hasDecoySmoke: false,
    hasReverseRounds: false,
    label: 'Easy',
  },
  normal: {
    showDelay: 580,
    pauseDelay: 250,
    lives: 1,
    hasDecoySmoke: false,
    hasReverseRounds: false,
    label: 'Normal',
  },
  hard: {
    showDelay: 460,
    pauseDelay: 180,
    lives: 0,
    hasDecoySmoke: false,
    hasReverseRounds: false,
    label: 'Hard',
  },
  expert: {
    showDelay: 380,
    pauseDelay: 140,
    lives: 0,
    hasDecoySmoke: true,
    hasReverseRounds: false,
    label: 'Expert',
  },
  master: {
    showDelay: 300,
    pauseDelay: 110,
    lives: 0,
    hasDecoySmoke: true,
    hasReverseRounds: true,
    label: 'Master',
  },
};

const DiyaIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20" />
    <path d="M8 14h8" />
    <path d="M10 18h4" />
    <ellipse cx="12" cy="6" rx="4" ry="3" />
    <path d="M12 3a4 3 0 0 0 0 6" strokeWidth="1.5" stroke="currentColor" />
  </svg>
);

const generateSequence = (length) => {
  const seq = [];
  while (seq.length < length) {
    const idx = Math.floor(Math.random() * GRID_SIZE);
    if (!seq.includes(idx)) seq.push(idx);
  }
  return seq;
};

export default function DiyaDash({ player }) {
  const [searchParams] = useSearchParams();
  const [difficulty, setDifficulty] = useState(() => {
    const p = searchParams.get('diff');
    return p && TIER_PARAMS[p] ? p : getSelectedDifficulty('diya-dash');
  });

  const tier = TIER_PARAMS[difficulty] || TIER_PARAMS.normal;
  const diffMultiplier = DIFFICULTY_TIERS[difficulty]?.multiplier || 1.5;

  const navigate = useNavigate();
  const [gameState, setGameState] = useState(() => {
    return searchParams.get('autostart') === '1' ? 'countdown' : 'idle';
  });
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState(1);
  const [rawScore, setRawScore] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScoreState] = useState(() => getTierBestScore('diya-dash', difficulty) || getBestScore('diya-dash') || 0);
  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [highlightedCell, setHighlightedCell] = useState(-1);
  const [decoyCell, setDecoyCell] = useState(-1);
  const [isReverseRound, setIsReverseRound] = useState(false);
  const [livesLeft, setLivesLeft] = useState(tier.lives);
  const [cellStates, setCellStates] = useState(Array(GRID_SIZE).fill('idle'));
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());
  const [showCompleteAnim, setShowCompleteAnim] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);
  const [inputStartTime, setInputStartTime] = useState(0);
  const [stats, setStats] = useState({ totalCorrect: 0, maxLevel: 1, speedBonuses: 0 });
  const [progressionResult, setProgressionResult] = useState(null);

  const timeoutRefs = useRef([]);
  const timerRef = useRef(null);
  const rawScoreRef = useRef(0);
  const statsRef = useRef({ totalCorrect: 0, maxLevel: 1, speedBonuses: 0 });

  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  const playSwaraSound = useCallback((cellIndex, type = 'normal') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'smoke') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        return;
      }

      if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        return;
      }

      const freq = SWARA_FREQS[cellIndex] || 440;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  const handleDifficultyChange = (newTier) => {
    setDifficulty(newTier);
    setSelectedDifficulty('diya-dash', newTier);
    setBestScoreState(getTierBestScore('diya-dash', newTier));
  };

  const startGame = useCallback(() => {
    setLevel(1);
    setRawScore(0);
    rawScoreRef.current = 0;
    setScore(0);
    setRemainingTime(60);
    setLivesLeft(tier.lives);
    statsRef.current = { totalCorrect: 0, maxLevel: 1, speedBonuses: 0 };
    setStats({ ...statsRef.current });
    setGameState('countdown');
  }, [tier.lives]);

  const handleCountdownComplete = useCallback(() => {
    setGameState('showing');
  }, []);

  const startSequenceShow = useCallback(() => {
    clearTimeouts();
    const seqLen = Math.min(8, level + 2);
    const seq = generateSequence(seqLen);
    const reverse = tier.hasReverseRounds && level >= 3 && level % 3 === 0;
    setIsReverseRound(reverse);

    // Pick decoy smoke cell on Expert/Master if applicable
    let smokeIdx = -1;
    if (tier.hasDecoySmoke && Math.random() < 0.65) {
      const available = Array.from({ length: GRID_SIZE }, (_, i) => i).filter((i) => !seq.includes(i));
      if (available.length > 0) {
        smokeIdx = available[Math.floor(Math.random() * available.length)];
      }
    }
    setDecoyCell(smokeIdx);
    setSequence(seq);
    setPlayerInput([]);
    setCellStates(Array(GRID_SIZE).fill('idle'));

    const stepInterval = tier.showDelay + tier.pauseDelay;

    seq.forEach((cellIdx, i) => {
      const showTimeout = setTimeout(() => {
        setHighlightedCell(cellIdx);
        setCellStates((prev) => {
          const next = [...prev];
          next[cellIdx] = 'highlighted';
          return next;
        });
        playSwaraSound(cellIdx);
      }, i * stepInterval);

      const hideTimeout = setTimeout(() => {
        setHighlightedCell(-1);
        setCellStates((prev) => {
          const next = [...prev];
          next[cellIdx] = 'idle';
          return next;
        });
      }, i * stepInterval + tier.showDelay);

      timeoutRefs.current.push(showTimeout, hideTimeout);
    });

    // Flash Decoy Smoke Cell if active midway
    if (smokeIdx >= 0) {
      const smokeTime = (seq.length / 2) * stepInterval;
      const smokeShowTimeout = setTimeout(() => {
        setCellStates((prev) => {
          const next = [...prev];
          next[smokeIdx] = 'smoke';
          return next;
        });
        playSwaraSound(smokeIdx, 'smoke');
      }, smokeTime);

      const smokeHideTimeout = setTimeout(() => {
        setCellStates((prev) => {
          const next = [...prev];
          next[smokeIdx] = 'idle';
          return next;
        });
      }, smokeTime + tier.showDelay);

      timeoutRefs.current.push(smokeShowTimeout, smokeHideTimeout);
    }

    const inputStartTimeout = setTimeout(() => {
      setGameState('input');
      setInputStartTime(Date.now());
    }, seq.length * stepInterval + 200);

    timeoutRefs.current.push(inputStartTimeout);
  }, [level, tier, clearTimeouts, playSwaraSound]);

  useEffect(() => {
    if (gameState === 'showing') {
      startSequenceShow();
    }
    return () => clearTimeouts();
  }, [gameState, startSequenceShow, clearTimeouts]);

  useEffect(() => {
    if (gameState === 'input' || gameState === 'showing') {
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const handleGameOver = useCallback(() => {
    clearTimeouts();
    clearInterval(timerRef.current);
    const timeBonus = Math.max(0, remainingTime * 4);
    const finalRaw = rawScoreRef.current + timeBonus;
    const finalTotal = Math.round(finalRaw * diffMultiplier);

    const progRes = recordGameResult('diya-dash', difficulty, finalTotal);
    setProgressionResult(progRes);

    setBestScoreState(Math.max(finalTotal, bestScore));
    setScore(finalTotal);

    if (player?.player_id) {
      submitScore(player.player_id, finalTotal, 60 - remainingTime, { game_id: 'diya-dash' }).catch(() => {});
    }
    setGameState('gameover');
  }, [clearTimeouts, remainingTime, diffMultiplier, difficulty, bestScore, player]);

  const handleCellTap = useCallback(
    (cellIdx) => {
      if (gameState !== 'input') return;

      // Check if player clicked the decoy smoke cell
      if (cellIdx === decoyCell) {
        playSwaraSound(cellIdx, 'wrong');
        setCellStates((prev) => {
          const next = [...prev];
          next[cellIdx] = 'wrong';
          return next;
        });
        setTimeout(() => handleGameOver(), 500);
        return;
      }

      const currentStep = playerInput.length;
      // In reverse rounds, expected is from tail to head
      const expectedCell = isReverseRound ? sequence[sequence.length - 1 - currentStep] : sequence[currentStep];

      if (cellIdx === expectedCell) {
        playSwaraSound(cellIdx);
        setCellStates((prev) => {
          const next = [...prev];
          next[cellIdx] = 'correct';
          return next;
        });
        setTimeout(() => {
          setCellStates((prev) => {
            const next = [...prev];
            next[cellIdx] = 'idle';
            return next;
          });
        }, 300);

        const newInput = [...playerInput, cellIdx];
        setPlayerInput(newInput);
        statsRef.current.totalCorrect++;

        if (newInput.length === sequence.length) {
          setShowCompleteAnim(true);

          // Speed bonus for quick repeat (under 3.5s)
          const elapsedSec = (Date.now() - inputStartTime) / 1000;
          let speedBonus = 0;
          if (elapsedSec < 3.5) {
            speedBonus = Math.round((3.5 - elapsedSec) * 40);
            statsRef.current.speedBonuses++;
          }

          const levelPoints = 100 * level + speedBonus;
          rawScoreRef.current += levelPoints;
          const currentTotal = Math.round(rawScoreRef.current * diffMultiplier);
          setRawScore(rawScoreRef.current);
          setScore(currentTotal);

          setTimeout(() => {
            setShowCompleteAnim(false);
            const newLevel = level + 1;
            setLevel(newLevel);
            statsRef.current.maxLevel = Math.max(statsRef.current.maxLevel, newLevel);
            setStats({ ...statsRef.current });
            setGameState('showing');
          }, 1100);
        }
      } else {
        playSwaraSound(cellIdx, 'wrong');
        setCellStates((prev) => {
          const next = [...prev];
          next[cellIdx] = 'wrong';
          return next;
        });

        // Mistake Shield check
        if (livesLeft > 0) {
          setLivesLeft((l) => l - 1);
          setTimeout(() => {
            setCellStates(Array(GRID_SIZE).fill('idle'));
            setPlayerInput([]);
            setGameState('showing'); // Replay sequence for forgiveness
          }, 500);
        } else {
          setTimeout(() => {
            handleGameOver();
          }, 500);
        }
      }
    },
    [gameState, decoyCell, playerInput, isReverseRound, sequence, playSwaraSound, inputStartTime, level, diffMultiplier, livesLeft, handleGameOver]
  );

  const handleRestart = useCallback(() => {
    clearTimeouts();
    clearInterval(timerRef.current);
    setGameState('idle');
    setLevel(1);
    setRawScore(0);
    rawScoreRef.current = 0;
    setScore(0);
    setRemainingTime(60);
    setSequence([]);
    setPlayerInput([]);
    setCellStates(Array(GRID_SIZE).fill('idle'));
    setShowCompleteAnim(false);
  }, [clearTimeouts]);

  if (gameState === 'gameover') {
    return (
      <GameResult
        gameId="diya-dash"
        gameName="Diya Dash"
        difficulty={difficulty}
        score={score}
        bestScore={Math.max(score, bestScore)}
        isPersonalBest={progressionResult?.isTierPB || progressionResult?.isGlobalPB}
        newlyUnlockedTier={progressionResult?.newlyUnlockedTier}
        scoreBreakdown={{
          base: rawScore,
          accuracy: Math.min(100, Math.round((stats.totalCorrect / Math.max(1, stats.totalCorrect + 1)) * 100)),
          maxCombo: level,
          multiplier: DIFFICULTY_TIERS[difficulty]?.multiplierLabel,
        }}
        stats={{
          levelReached: level,
          correctTaps: stats.totalCorrect,
          speedBonuses: stats.speedBonuses,
        }}
        onRestart={handleRestart}
        onNextDifficulty={(nextTier) => {
          handleDifficultyChange(nextTier);
          handleRestart();
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 88px)',
        background:
          'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(255,153,51,0.12), transparent 60%), linear-gradient(180deg, #140a2e 0%, #3a0a1e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Controls Header (Pause + Sound) */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 30, display: 'flex', gap: '0.5rem' }}>
        {(gameState === 'showing' || gameState === 'input') && (
          <button
            onClick={() => setIsPaused(true)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFD166',
              cursor: 'pointer',
            }}
            title="Pause Game (Esc)"
            aria-label="Pause"
          >
            <Pause size={18} />
          </button>
        )}

        <button
          onClick={toggleSound}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: soundEnabled ? '#fbbf24' : 'var(--text-muted, #9CA3AF)',
            cursor: 'pointer',
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <PauseOverlay
            gameId="diya-dash"
            onResume={() => setIsPaused(false)}
            onRestart={() => {
              setIsPaused(false);
              handleRestart();
            }}
            onToggleSound={toggleSound}
            soundEnabled={soundEnabled}
            onQuit={() => navigate('/games')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Pre-Game Idle Card */}
        {gameState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 420,
              width: '100%',
              margin: 'auto',
              background: 'var(--card, rgba(20, 10, 46, 0.95))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-xl, 16px)',
              padding: '1.75rem',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              gap: '1rem',
            }}
          >
            <div style={{ fontSize: '3rem', color: '#fbbf24' }}>
              <DiyaIcon />
            </div>
            <div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '0 0 0.25rem', fontFamily: 'var(--font-display)' }}>
                DIYA DASH
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                Listen to the sacred Swaras, memorize the glowing diya sequence, and reproduce it flawlessly!
              </p>
            </div>

            {/* Difficulty Selector */}
            <div style={{ width: '100%' }}>
              <DifficultySelector
                gameId="diya-dash"
                selectedTier={difficulty}
                onChange={handleDifficultyChange}
                compact={true}
                showDescription={true}
              />
            </div>

            <button
              onClick={startGame}
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: '1.1rem',
                padding: '0.85rem 2.5rem',
                borderRadius: 'var(--radius-xl, 12px)',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#0f0f23',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
                width: '100%',
              }}
            >
              START ({DIFFICULTY_TIERS[difficulty]?.name.toUpperCase()})
            </button>
          </motion.div>
        )}

        {/* Countdown */}
        {gameState === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}
          >
            <Countdown onComplete={handleCountdownComplete} />
          </motion.div>
        )}

        {/* Gameplay (Showing / Input) */}
        {(gameState === 'showing' || gameState === 'input') && (
          <motion.div
            key="gameplay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: '420px',
              gap: '1rem',
              flex: 1,
              paddingTop: '0.5rem',
            }}
          >
            {/* Reverse Round or Smoke Alert */}
            {isReverseRound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '0.35rem 0.9rem',
                  background: 'rgba(236, 72, 153, 0.2)',
                  border: '1px solid #EC4899',
                  borderRadius: '9999px',
                  color: '#F472B6',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <RotateCcw size={14} /> PRADAKSHINA ROUND: REPEAT IN REVERSE!
              </motion.div>
            )}

            {/* HUD */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                background: 'var(--card, rgba(255,255,255,0.05))',
                borderRadius: 'var(--radius-xl, 12px)',
                padding: '0.65rem 0.85rem',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LEVEL</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f59e0b' }}>{level}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F3F4F6' }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LIVES</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: livesLeft > 0 ? '#4ADE80' : '#EF4444' }}>
                  {livesLeft > 0 ? '🛡️'.repeat(livesLeft) : '0'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TIME</div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: remainingTime <= 10 ? '#ef4444' : remainingTime <= 20 ? '#f59e0b' : 'var(--text)',
                  }}
                >
                  {remainingTime}s
                </div>
              </div>
            </div>

            {/* Diya Grid Area */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence>
                {showCompleteAnim && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    style={{
                      position: 'absolute',
                      zIndex: 20,
                      background: 'rgba(15,15,35,0.92)',
                      borderRadius: 'var(--radius-xl, 12px)',
                      padding: '0.85rem 1.75rem',
                      textAlign: 'center',
                      boxShadow: '0 0 30px rgba(34,197,94,0.4)',
                    }}
                  >
                    <Sparkles size={24} color="#f59e0b" style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#22c55e' }}>Sequence Cleared!</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.9rem',
                  padding: '1.25rem',
                  background: 'var(--card, rgba(255,255,255,0.03))',
                  borderRadius: 'var(--radius-xl, 16px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {Array.from({ length: GRID_SIZE }).map((_, idx) => {
                  const state = cellStates[idx];
                  const isHighlighted = state === 'highlighted';
                  const isCorrect = state === 'correct';
                  const isWrong = state === 'wrong';
                  const isSmoke = state === 'smoke';
                  const canTap = gameState === 'input' && !showCompleteAnim;

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => canTap && handleCellTap(idx)}
                      animate={isWrong ? { x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } } : {}}
                      style={{
                        width: 'clamp(62px, 18vw, 85px)',
                        height: 'clamp(62px, 18vw, 85px)',
                        borderRadius: '50%',
                        border: 'none',
                        background: isHighlighted
                          ? 'radial-gradient(circle, #fbbf24, #f59e0b, #d97706)'
                          : isCorrect
                          ? 'radial-gradient(circle, #22c55e, #16a34a)'
                          : isWrong
                          ? 'radial-gradient(circle, #ef4444, #dc2626)'
                          : isSmoke
                          ? 'radial-gradient(circle, #6B7280, #374151)'
                          : 'radial-gradient(circle, #2a2a40, #1a1a2e)',
                        boxShadow: isHighlighted
                          ? '0 0 30px rgba(251,191,36,0.7), 0 0 50px rgba(245,158,11,0.4)'
                          : isCorrect
                          ? '0 0 20px rgba(34,197,94,0.5)'
                          : isWrong
                          ? '0 0 20px rgba(239,68,68,0.5)'
                          : isSmoke
                          ? '0 0 20px rgba(107,114,128,0.6)'
                          : '0 2px 10px rgba(0,0,0,0.3)',
                        cursor: canTap ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s, background 0.2s, box-shadow 0.2s',
                        transform: isHighlighted ? 'scale(1.15)' : 'scale(1)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <DiyaIcon />
                      {isHighlighted && (
                        <motion.div
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            border: '2px solid rgba(251,191,36,0.6)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Instruction Footer */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {gameState === 'showing' ? (
                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  Listen & watch the sacred diyas...
                </motion.span>
              ) : (
                <span>
                  Tap in {isReverseRound ? 'REVERSE' : 'order'} ({playerInput.length}/{sequence.length})
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}