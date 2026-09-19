import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, Sparkles, RotateCw, CheckCircle2, XCircle, Pause } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Countdown from '../../components/Countdown';
import GameResult from '../shared/GameResult';
import DifficultySelector from '../../components/DifficultySelector';
import PauseOverlay from '../../components/PauseOverlay';
import { getBestScore, setBestScore, getSoundEnabled, setSoundEnabled, getPlayer } from '../../utils/storage';
import { getSelectedDifficulty, setSelectedDifficulty, recordGameResult, getTierBestScore } from '../../utils/progression';
import { DIFFICULTY_TIERS } from '../../config/difficulties';
import { submitScore } from '../../services/api';

const SHAPES = ['circle', 'diamond', 'square', 'star', 'lotus'];
const COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

const TIER_CONFIG = {
  easy: {
    gridSize: 3,
    timePerRound: 12,
    hasRotation: false,
    hasDualMissing: false,
    totalRounds: 10,
    label: 'Easy (3x3)',
  },
  normal: {
    gridSize: 3,
    timePerRound: 9,
    hasRotation: false,
    hasDualMissing: false,
    totalRounds: 12,
    label: 'Normal (3x3 Symmetry)',
  },
  hard: {
    gridSize: 4,
    timePerRound: 7,
    hasRotation: true,
    hasDualMissing: false,
    totalRounds: 12,
    label: 'Hard (4x4 Rotational)',
  },
  expert: {
    gridSize: 4,
    timePerRound: 5.5,
    hasRotation: true,
    hasDualMissing: false,
    totalRounds: 14,
    label: 'Expert (4x4 Blitz)',
  },
  master: {
    gridSize: 5,
    timePerRound: 5.0,
    hasRotation: true,
    hasDualMissing: true,
    totalRounds: 15,
    label: 'Master (5x5 Dual Missing)',
  },
};

function CellShape({ shape, color, rotation = 0, size = 38 }) {
  const s = size;
  const transform = `rotate(${rotation}deg)`;

  if (shape === 'circle') {
    return (
      <div
        style={{
          width: s,
          height: s,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, #fff 5%, ${color} 70%)`,
          boxShadow: `0 0 12px ${color}66`,
          transform,
        }}
      />
    );
  }
  if (shape === 'diamond') {
    return (
      <div
        style={{
          width: s * 0.75,
          height: s * 0.75,
          background: `linear-gradient(135deg, #fff 10%, ${color} 80%)`,
          transform: `rotate(${rotation + 45}deg)`,
          borderRadius: 4,
          boxShadow: `0 0 12px ${color}66`,
        }}
      />
    );
  }
  if (shape === 'square') {
    return (
      <div
        style={{
          width: s * 0.85,
          height: s * 0.85,
          background: color,
          borderRadius: 6,
          border: '2px solid rgba(255,255,255,0.4)',
          transform,
          boxShadow: `0 0 10px ${color}55`,
        }}
      />
    );
  }
  if (shape === 'star') {
    return (
      <div
        style={{
          width: s,
          height: s,
          clipPath:
            'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          background: `radial-gradient(circle, #fff 15%, ${color} 80%)`,
          transform,
          boxShadow: `0 0 14px ${color}88`,
        }}
      />
    );
  }
  if (shape === 'lotus') {
    return (
      <div
        style={{
          width: s,
          height: s,
          clipPath:
            'polygon(50% 0%, 80% 20%, 100% 60%, 80% 90%, 50% 100%, 20% 90%, 0% 60%, 20% 20%)',
          background: `radial-gradient(circle at 50% 40%, #fff 20%, ${color} 85%)`,
          transform,
          boxShadow: `0 0 14px ${color}88`,
        }}
      />
    );
  }
  return <div style={{ width: s, height: s, background: color, borderRadius: '50%', transform }} />;
}

function generateRangoliPuzzle(tierKey, roundNum) {
  const cfg = TIER_CONFIG[tierKey] || TIER_CONFIG.normal;
  const N = cfg.gridSize;
  const totalCells = N * N;
  const pattern = [];

  // Pick palettes for this round
  const baseColor1 = COLORS[(roundNum * 2) % COLORS.length];
  const baseColor2 = COLORS[(roundNum * 2 + 1) % COLORS.length];
  const centerColor = COLORS[(roundNum * 2 + 2) % COLORS.length];
  const shape1 = SHAPES[roundNum % SHAPES.length];
  const shape2 = SHAPES[(roundNum + 2) % SHAPES.length];

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const distFromCenter = Math.abs(r - Math.floor(N / 2)) + Math.abs(c - Math.floor(N / 2));
      const isCenter = r === Math.floor(N / 2) && c === Math.floor(N / 2);
      const isCorner = (r === 0 || r === N - 1) && (c === 0 || c === N - 1);

      let shape = isCenter ? shape1 : isCorner ? shape2 : (r + c) % 2 === 0 ? shape1 : shape2;
      let color = isCenter ? centerColor : distFromCenter <= 1 ? baseColor1 : baseColor2;

      let rotation = 0;
      if (cfg.hasRotation) {
        // Rotational symmetry: 0 deg top-left, 90 deg top-right, 180 bottom-right, 270 bottom-left
        if (r < N / 2 && c >= N / 2) rotation = 90;
        else if (r >= N / 2 && c >= N / 2) rotation = 180;
        else if (r >= N / 2 && c < N / 2) rotation = 270;
      }

      pattern.push({ shape, color, rotation });
    }
  }

  // Choose 1 or 2 missing cell indices
  const missingIndices = [];
  const primaryMissing = Math.floor(Math.random() * totalCells);
  missingIndices.push(primaryMissing);

  if (cfg.hasDualMissing) {
    let secondMissing = (primaryMissing + Math.floor(totalCells / 2)) % totalCells;
    if (secondMissing === primaryMissing) secondMissing = (primaryMissing + 1) % totalCells;
    missingIndices.push(secondMissing);
  }

  const correct1 = pattern[missingIndices[0]];

  // Generate 4 distinct options for first missing cell
  const options = [{ ...correct1 }];

  if (cfg.hasRotation) {
    // Generate distractors with wrong rotation or wrong color/shape
    const wrongRotations = [90, 180, 270].map((deg) => ({
      ...correct1,
      rotation: (correct1.rotation + deg) % 360,
    }));
    options.push(wrongRotations[0]);
    options.push(wrongRotations[1]);
    const diffShape = SHAPES.find((s) => s !== correct1.shape) || 'star';
    options.push({ shape: diffShape, color: correct1.color, rotation: correct1.rotation });
  } else {
    while (options.length < 4) {
      const altShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const altColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      if (
        !options.some(
          (o) => o.shape === altShape && o.color === altColor && o.rotation === correct1.rotation
        )
      ) {
        options.push({ shape: altShape, color: altColor, rotation: 0 });
      }
    }
  }

  options.sort(() => Math.random() - 0.5);

  return {
    gridSize: N,
    pattern,
    missingIndices,
    correct1,
    options,
    timeLimit: cfg.timePerRound,
    hasDualMissing: cfg.hasDualMissing,
  };
}

export default function RangoliRush({ player }) {
  const [searchParams] = useSearchParams();
  const [difficulty, setDifficulty] = useState(() => {
    const p = searchParams.get('diff');
    return p && TIER_CONFIG[p] ? p : getSelectedDifficulty('rangoli-rush');
  });

  const tier = TIER_CONFIG[difficulty] || TIER_CONFIG.normal;
  const diffMultiplier = DIFFICULTY_TIERS[difficulty]?.multiplier || 1.5;

  const navigate = useNavigate();
  const [gameState, setGameState] = useState(() => {
    return searchParams.get('autostart') === '1' ? 'countdown' : 'idle';
  });
  const [isPaused, setIsPaused] = useState(false);
  const [rawScore, setRawScore] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScoreState] = useState(() => getTierBestScore('rangoli-rush', difficulty) || getBestScore('rangoli-rush') || 0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(tier.timePerRound);
  const [puzzle, setPuzzle] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [stats, setStats] = useState({ correct: 0, total: 0, speedBonuses: 0 });
  const [progressionResult, setProgressionResult] = useState(null);
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());

  const timerRef = useRef(null);
  const rawScoreRef = useRef(0);
  const statsRef = useRef({ correct: 0, total: 0, speedBonuses: 0 });
  const roundStartTime = useRef(0);

  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'correct') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } else if (type === 'wrong') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch (e) {}
    },
    [soundEnabled]
  );

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabledState(newVal);
    setSoundEnabled(newVal);
  };

  const handleDifficultyChange = (newTier) => {
    setDifficulty(newTier);
    setSelectedDifficulty('rangoli-rush', newTier);
    setBestScoreState(getTierBestScore('rangoli-rush', newTier));
  };

  const beginRound = useCallback(
    (roundNum) => {
      const p = generateRangoliPuzzle(difficulty, roundNum);
      setPuzzle(p);
      setTimeLeft(p.timeLimit);
      setSelectedOption(null);
      setFeedback(null);
      roundStartTime.current = Date.now();
      setGameState('playing');
    },
    [difficulty]
  );

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = Math.round(rawScoreRef.current * diffMultiplier);
    const progRes = recordGameResult('rangoli-rush', difficulty, finalScore);
    setProgressionResult(progRes);

    setBestScoreState(Math.max(finalScore, bestScore));
    setScore(finalScore);

    if (player?.player_id) {
      submitScore(player.player_id, finalScore, 0, { game_id: 'rangoli-rush' }).catch(() => {});
    }
    setGameState('gameover');
  }, [diffMultiplier, difficulty, bestScore, player]);

  const nextRound = useCallback(() => {
    if (round >= tier.totalRounds) {
      endGame();
      return;
    }
    const nxt = round + 1;
    setRound(nxt);
    beginRound(nxt);
  }, [round, tier.totalRounds, endGame, beginRound]);

  const handleTimeout = useCallback(() => {
    setFeedback('wrong');
    playSound('wrong');
    statsRef.current.total++;
    setStats({ ...statsRef.current });
    setTimeout(() => nextRound(), 900);
  }, [nextRound, playSound]);

  useEffect(() => {
    if (gameState !== 'playing' || feedback !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, feedback, handleTimeout]);

  const handleOptionSelect = useCallback(
    (optIdx) => {
      if (feedback !== null || !puzzle) return;
      if (timerRef.current) clearInterval(timerRef.current);

      setSelectedOption(optIdx);
      const chosen = puzzle.options[optIdx];
      const correct = puzzle.correct1;

      const isCorrect =
        chosen.shape === correct.shape &&
        chosen.color === correct.color &&
        (tier.hasRotation ? chosen.rotation === correct.rotation : true);

      const elapsedSec = (Date.now() - roundStartTime.current) / 1000;
      let pts = 0;

      if (isCorrect) {
        playSound('correct');
        setFeedback('correct');
        let speedBonus = 0;
        if (elapsedSec < 1.8) {
          speedBonus = 120;
          statsRef.current.speedBonuses++;
        }
        pts = 100 + speedBonus + Math.round(timeLeft * 10);
        statsRef.current.correct++;
      } else {
        playSound('wrong');
        setFeedback('wrong');
        pts = -20;
      }

      statsRef.current.total++;
      rawScoreRef.current = Math.max(0, rawScoreRef.current + pts);
      const updatedTotal = Math.round(rawScoreRef.current * diffMultiplier);
      setRawScore(rawScoreRef.current);
      setScore(updatedTotal);
      setStats({ ...statsRef.current });

      setTimeout(() => nextRound(), 1000);
    },
    [feedback, puzzle, tier.hasRotation, timeLeft, diffMultiplier, playSound, nextRound]
  );

  const startGame = useCallback(() => {
    setScore(0);
    setRawScore(0);
    rawScoreRef.current = 0;
    setRound(1);
    statsRef.current = { correct: 0, total: 0, speedBonuses: 0 };
    setStats({ ...statsRef.current });
    setGameState('countdown');
  }, []);

  const handleCountdownComplete = useCallback(() => {
    beginRound(1);
  }, [beginRound]);

  const accuracy = Math.round((stats.correct / Math.max(1, stats.total)) * 100);

  if (gameState === 'gameover') {
    return (
      <GameResult
        gameId="rangoli-rush"
        gameName="Rangoli Rush"
        difficulty={difficulty}
        score={score}
        bestScore={Math.max(score, bestScore)}
        isPersonalBest={progressionResult?.isTierPB || progressionResult?.isGlobalPB}
        newlyUnlockedTier={progressionResult?.newlyUnlockedTier}
        scoreBreakdown={{
          base: rawScore,
          accuracy: accuracy,
          maxCombo: stats.correct,
          multiplier: DIFFICULTY_TIERS[difficulty]?.multiplierLabel,
        }}
        stats={{
          roundsCompleted: `${round}/${tier.totalRounds}`,
          accuracy: `${accuracy}%`,
          speedBonuses: stats.speedBonuses,
        }}
        onRestart={startGame}
        onNextDifficulty={(nextTier) => {
          handleDifficultyChange(nextTier);
          startGame();
        }}
      />
    );
  }

  const cellSize = puzzle?.gridSize === 5 ? 44 : puzzle?.gridSize === 4 ? 54 : 64;

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 88px)',
        background:
          'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(236,72,153,0.15), transparent 60%), linear-gradient(180deg, #140a2e 0%, #300a28 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Controls Header (Pause + Sound) */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 30, display: 'flex', gap: '0.5rem' }}>
        {gameState === 'playing' && (
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
            cursor: 'pointer',
            color: soundEnabled ? '#EC4899' : 'var(--text-muted, #9CA3AF)',
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <PauseOverlay
            gameId="rangoli-rush"
            onResume={() => setIsPaused(false)}
            onRestart={() => {
              setIsPaused(false);
              handleStart();
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
              gap: '1.2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 16px rgba(236,72,153,0.5))' }}>
              🌸
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #EC4899, #F59E0B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}
              >
                RANGOLI RUSH
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
                Complete sacred rangoli mandalas! Match symmetry, color, and rotation under time pressure.
              </p>
            </div>

            {/* Difficulty Selector */}
            <div style={{ width: '100%' }}>
              <DifficultySelector
                gameId="rangoli-rush"
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
                background: 'linear-gradient(135deg, #EC4899, #F59E0B)',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(236,72,153,0.4)',
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

        {/* Playing Phase */}
        {gameState === 'playing' && puzzle && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: '440px',
              gap: '1rem',
              flex: 1,
              paddingTop: '0.5rem',
            }}
          >
            {/* HUD */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 'var(--radius-xl, 12px)',
                padding: '0.65rem 0.85rem',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ROUND</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#EC4899' }}>
                  {round}/{tier.totalRounds}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F3F4F6' }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACCURACY</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10B981' }}>{accuracy}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TIME</div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: timeLeft <= 2 ? '#EF4444' : '#F59E0B',
                  }}
                >
                  {timeLeft}s
                </div>
              </div>
            </div>

            {/* Rangoli Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)`,
                gap: '0.45rem',
                padding: '1rem',
                background: 'rgba(15,10,35,0.85)',
                borderRadius: 'var(--radius-xl, 16px)',
                border: '2px solid rgba(236,72,153,0.3)',
                boxShadow: '0 0 30px rgba(236,72,153,0.15)',
              }}
            >
              {puzzle.pattern.map((cell, idx) => {
                const isMissing = puzzle.missingIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isMissing ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.03)',
                      border: isMissing ? '2px dashed #EC4899' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      position: 'relative',
                    }}
                  >
                    {isMissing ? (
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EC4899' }}>?</span>
                    ) : (
                      <CellShape
                        shape={cell.shape}
                        color={cell.color}
                        rotation={cell.rotation}
                        size={cellSize * 0.65}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instruction Banner */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {tier.hasRotation
                ? 'Select the piece matching shape, color & rotation symmetry!'
                : 'Select the piece that completes the mandala pattern!'}
            </div>

            {/* 4 Choices */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                width: '100%',
              }}
            >
              {puzzle.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let borderColor = 'rgba(255,255,255,0.15)';
                let bg = 'rgba(255,255,255,0.05)';

                if (isSelected) {
                  if (feedback === 'correct') {
                    borderColor = '#10B981';
                    bg = 'rgba(16,185,129,0.2)';
                  } else if (feedback === 'wrong') {
                    borderColor = '#EF4444';
                    bg = 'rgba(239,68,68,0.2)';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOptionSelect(idx)}
                    style={{
                      height: '75px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 'var(--radius-lg, 12px)',
                      cursor: feedback === null ? 'pointer' : 'default',
                      position: 'relative',
                    }}
                  >
                    <CellShape shape={opt.shape} color={opt.color} rotation={opt.rotation} size={36} />
                    {tier.hasRotation && opt.rotation > 0 && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: '2px',
                        }}
                      >
                        {opt.rotation}°
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
