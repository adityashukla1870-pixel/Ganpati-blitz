import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Brain, Sparkles, Zap, Flame, Shield, HelpCircle, CheckCircle2, XCircle, Pause } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Countdown from '../../components/Countdown';
import GameResult from '../shared/GameResult';
import DifficultySelector from '../../components/DifficultySelector';
import PauseOverlay from '../../components/PauseOverlay';
import { getBestScore, setBestScore, getSoundEnabled, setSoundEnabled, getPlayer, setUniversalPoints } from '../../utils/storage';
import { getSelectedDifficulty, setSelectedDifficulty, recordGameResult, getTierBestScore } from '../../utils/progression';
import { DIFFICULTY_TIERS } from '../../config/difficulties';
import { submitScore } from '../../services/api';
import './GanpatiLogic.css';

const GAME_DURATION = 45;

const TIER_PARAMS = {
  easy: {
    questionTime: 12,
    wrongPenalty: 0,
    label: 'Easy (12s)',
  },
  normal: {
    questionTime: 9,
    wrongPenalty: 0,
    label: 'Normal (9s)',
  },
  hard: {
    questionTime: 6.5,
    wrongPenalty: 0,
    label: 'Hard (6.5s)',
  },
  expert: {
    questionTime: 4.5,
    wrongPenalty: 1,
    label: 'Expert (4.5s Blitz)',
  },
  master: {
    questionTime: 3.2,
    wrongPenalty: 3, // Docks 3s from main clock on mistake!
    label: 'Master (3.2s Ultra Blitz)',
  },
};

// Procedural Puzzle Generators

function generateArithmeticSequence(tierKey) {
  const isHard = tierKey === 'hard' || tierKey === 'expert' || tierKey === 'master';
  const isMaster = tierKey === 'master';

  let seq = [];
  let answer = 0;
  let ruleText = '';

  const mode = Math.random();

  // Mode 1: Arithmetic Progression
  if (mode < 0.35 || (!isHard && mode < 0.6)) {
    const start = Math.floor(Math.random() * 20) + 1;
    const diff = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 6) + 2);
    seq = [start, start + diff, start + 2 * diff, start + 3 * diff];
    answer = start + 4 * diff;
    ruleText = 'Find the next number';
  }
  // Mode 2: Alternating Operations (+a, -b, +a, -b)
  else if (mode < 0.65) {
    const a = Math.floor(Math.random() * 5) + 3;
    const b = Math.floor(Math.random() * 3) + 1;
    let curr = Math.floor(Math.random() * 15) + 10;
    seq = [curr];
    curr += a;
    seq.push(curr);
    curr -= b;
    seq.push(curr);
    curr += a;
    seq.push(curr);
    answer = curr - b;
    ruleText = 'Alternating sequence: What comes next?';
  }
  // Mode 3: Fibonacci Variant or Squares (Hard+)
  else if (mode < 0.85 || !isMaster) {
    const start1 = Math.floor(Math.random() * 4) + 1;
    const start2 = Math.floor(Math.random() * 4) + 2;
    seq = [start1, start2, start1 + start2, start2 + (start1 + start2)];
    answer = seq[2] + seq[3];
    ruleText = 'Sum of previous two numbers: Next?';
  }
  // Mode 4: Quadratic series n^2 + c
  else {
    const c = Math.floor(Math.random() * 5) + 1;
    seq = [1 * 1 + c, 2 * 2 + c, 3 * 3 + c, 4 * 4 + c];
    answer = 5 * 5 + c;
    ruleText = 'Square progression: What comes next?';
  }

  // Generate 4 options
  const opts = [answer, answer + 2, answer - 2, answer + 5];
  opts.sort(() => Math.random() - 0.5);

  return {
    type: 'sequence',
    title: 'NUMBER SEQUENCE',
    ruleText,
    display: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
        {seq.map((num, i) => (
          <React.Fragment key={i}>
            <span style={{ color: '#F3F4F6' }}>{num}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
          </React.Fragment>
        ))}
        <span style={{ color: '#F59E0B', fontSize: '1.6rem' }}>?</span>
      </div>
    ),
    options: opts.map((o) => `${o}`),
    correctIndex: opts.indexOf(answer),
  };
}

function generateMatrixReasoning() {
  const base1 = Math.floor(Math.random() * 6) + 2;
  const factor = Math.floor(Math.random() * 3) + 2;
  const topL = base1;
  const topR = base1 * factor;
  const base2 = Math.floor(Math.random() * 6) + 3;
  const botL = base2;
  const answer = base2 * factor;

  const opts = [answer, answer + factor, Math.max(1, answer - factor), answer * 2];
  opts.sort(() => Math.random() - 0.5);

  return {
    type: 'matrix',
    title: '2x2 MATRIX LOGIC',
    ruleText: 'Discover the rule relating columns',
    display: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 64px)', gap: '8px', margin: 'auto' }}>
        <div style={matrixCellStyle}>{topL}</div>
        <div style={matrixCellStyle}>{topR}</div>
        <div style={matrixCellStyle}>{botL}</div>
        <div style={{ ...matrixCellStyle, color: '#F59E0B', borderColor: '#F59E0B' }}>?</div>
      </div>
    ),
    options: opts.map((o) => `${o}`),
    correctIndex: opts.indexOf(answer),
  };
}

function generateFestiveSyllogism() {
  const sweets = ['Modak', 'Laddu', 'Peda', 'Jalebi'];
  sweets.sort(() => Math.random() - 0.5);
  const [a, b, c] = sweets;

  // Statement: A is heavier than B, B is heavier than C
  const askLightest = Math.random() > 0.5;
  const answer = askLightest ? c : a;

  const opts = [a, b, c, 'Cannot tell'];
  opts.sort(() => Math.random() - 0.5);

  return {
    type: 'syllogism',
    title: 'FESTIVE DEDUCTION',
    ruleText: askLightest ? 'Which sweet is the LIGHTEST?' : 'Which sweet is the HEAVIEST?',
    display: (
      <div style={{ fontSize: '0.95rem', color: '#E5E7EB', lineHeight: 1.5, textAlign: 'center' }}>
        <div>• <strong>{a}</strong> is heavier than <strong>{b}</strong></div>
        <div>• <strong>{b}</strong> is heavier than <strong>{c}</strong></div>
      </div>
    ),
    options: opts,
    correctIndex: opts.indexOf(answer),
  };
}

function generateOddOneOut() {
  const mode = Math.random();

  // Mode 1: 3 even, 1 odd
  if (mode < 0.5) {
    const evens = [2, 4, 6, 8, 12, 14, 16, 18, 22].sort(() => Math.random() - 0.5).slice(0, 3);
    const odds = [3, 5, 7, 9, 11, 13, 15, 17].sort(() => Math.random() - 0.5);
    const odd = odds[0];
    const opts = [...evens, odd].sort(() => Math.random() - 0.5);
    return {
      type: 'odd',
      title: 'ODD-ONE-OUT',
      ruleText: 'Which number does NOT belong with the others?',
      display: <div style={{ fontSize: '1.2rem', color: '#38BDF8', fontWeight: 800 }}>Odd-One-Out Rule</div>,
      options: opts.map((n) => `${n}`),
      correctIndex: opts.indexOf(odd),
    };
  }
  // Mode 2: 3 multiples of 5, 1 not
  else {
    const mults = [15, 20, 25, 35, 40, 45].sort(() => Math.random() - 0.5).slice(0, 3);
    const non = [14, 22, 28, 33, 42][Math.floor(Math.random() * 5)];
    const opts = [...mults, non].sort(() => Math.random() - 0.5);
    return {
      type: 'odd',
      title: 'ODD-ONE-OUT',
      ruleText: 'Which number breaks the pattern?',
      display: <div style={{ fontSize: '1.2rem', color: '#38BDF8', fontWeight: 800 }}>Divisibility Rule</div>,
      options: opts.map((n) => `${n}`),
      correctIndex: opts.indexOf(non),
    };
  }
}

function generateQuestion(tierKey) {
  const roll = Math.random();
  if (roll < 0.4) return generateArithmeticSequence(tierKey);
  if (roll < 0.65) return generateMatrixReasoning();
  if (roll < 0.85) return generateFestiveSyllogism();
  return generateOddOneOut();
}

export default function GanpatiLogic({ player }) {
  const [searchParams] = useSearchParams();
  const [difficulty, setDifficulty] = useState(() => {
    const p = searchParams.get('diff');
    return p && TIER_PARAMS[p] ? p : getSelectedDifficulty('ganpati-logic');
  });

  const tier = TIER_PARAMS[difficulty] || TIER_PARAMS.normal;
  const diffMultiplier = DIFFICULTY_TIERS[difficulty]?.multiplier || 1.5;

  const navigate = useNavigate();
  const [gameState, setGameState] = useState(() => {
    return searchParams.get('autostart') === '1' ? 'countdown' : 'idle';
  });
  const [isPaused, setIsPaused] = useState(false);
  const [rawScore, setRawScore] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScoreState] = useState(() => getTierBestScore('ganpati-logic', difficulty) || getBestScore('ganpati-logic') || 0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [qTimeLeft, setQTimeLeft] = useState(tier.questionTime);
  const [currentQ, setCurrentQ] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [stats, setStats] = useState({ answered: 0, correct: 0, speedBonuses: 0 });
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());
  const [progressionResult, setProgressionResult] = useState(null);

  const timerRef = useRef(null);
  const qTimerRef = useRef(null);
  const rawScoreRef = useRef(0);
  const streakRef = useRef(0);
  const statsRef = useRef({ answered: 0, correct: 0, speedBonuses: 0 });
  const qStartTime = useRef(0);

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
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } else if (type === 'wrong') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch (e) {}
    },
    [soundEnabled]
  );

  const handleDifficultyChange = (newTier) => {
    setDifficulty(newTier);
    setSelectedDifficulty('ganpati-logic', newTier);
    setBestScoreState(getTierBestScore('ganpati-logic', newTier));
  };

  const nextQuestion = useCallback(() => {
    const q = generateQuestion(difficulty);
    setCurrentQ(q);
    setSelectedIdx(null);
    setFeedback(null);
    setQTimeLeft(tier.questionTime);
    qStartTime.current = Date.now();
  }, [difficulty, tier.questionTime]);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (qTimerRef.current) clearInterval(qTimerRef.current);

    const finalScore = Math.round(rawScoreRef.current * diffMultiplier);
    const progRes = recordGameResult('ganpati-logic', difficulty, finalScore);
    setProgressionResult(progRes);

    setBestScoreState(Math.max(finalScore, bestScore));
    setScore(finalScore);

    if (player?.player_id) {
      submitScore(player.player_id, finalScore, GAME_DURATION - timeLeft, { game_id: 'ganpati-logic' })
        .then((res) => {
          if (res?.new_universal_points !== undefined) {
            setUniversalPoints(res.new_universal_points);
          }
        })
        .catch(() => {});
    }
    setGameState('gameover');
  }, [diffMultiplier, difficulty, bestScore, player, timeLeft]);

  // Overall match clock
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, endGame]);

  // Question countdown clock
  useEffect(() => {
    if (gameState !== 'playing' || feedback !== null) return;

    qTimerRef.current = setInterval(() => {
      setQTimeLeft((prev) => {
        if (prev <= 0.2) {
          clearInterval(qTimerRef.current);
          // Timeout counts as miss
          setFeedback('wrong');
          playSound('wrong');
          streakRef.current = 0;
          setStreak(0);
          statsRef.current.answered++;
          setTimeout(() => nextQuestion(), 700);
          return 0;
        }
        return prev - 0.2;
      });
    }, 200);

    return () => clearInterval(qTimerRef.current);
  }, [gameState, feedback, nextQuestion, playSound]);

  const handleAnswerSelect = useCallback(
    (idx) => {
      if (feedback !== null || !currentQ) return;
      if (qTimerRef.current) clearInterval(qTimerRef.current);

      setSelectedIdx(idx);
      const isCorrect = idx === currentQ.correctIndex;
      const elapsed = (Date.now() - qStartTime.current) / 1000;
      statsRef.current.answered++;

      if (isCorrect) {
        playSound('correct');
        setFeedback('correct');
        streakRef.current += 1;
        const currentStreakVal = streakRef.current;
        setStreak(currentStreakVal);
        setMaxStreak((prev) => Math.max(prev, currentStreakVal));
        statsRef.current.correct++;

        let speedBonus = 0;
        if (elapsed < 1.5) {
          speedBonus = 100;
          statsRef.current.speedBonuses++;
        }

        const streakMult = Math.min(3, 1 + currentStreakVal * 0.25);
        const pts = Math.round((100 + speedBonus + Math.round(qTimeLeft * 15)) * streakMult);
        rawScoreRef.current += pts;
      } else {
        playSound('wrong');
        setFeedback('wrong');
        streakRef.current = 0;
        setStreak(0);

        // Penalty on Master
        if (tier.wrongPenalty > 0) {
          setTimeLeft((t) => Math.max(1, t - tier.wrongPenalty));
        }
      }

      const total = Math.round(rawScoreRef.current * diffMultiplier);
      setRawScore(rawScoreRef.current);
      setScore(total);
      setStats({ ...statsRef.current });

      setTimeout(() => nextQuestion(), 750);
    },
    [feedback, currentQ, playSound, qTimeLeft, diffMultiplier, tier.wrongPenalty, nextQuestion]
  );

  const handleStart = () => {
    setGameState('countdown');
    setRawScore(0);
    rawScoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setStreak(0);
    streakRef.current = 0;
    setMaxStreak(0);
    statsRef.current = { answered: 0, correct: 0, speedBonuses: 0 };
    setStats({ ...statsRef.current });
  };

  const handleCountdownComplete = () => {
    setGameState('playing');
    nextQuestion();
  };

  const accuracy = Math.round((stats.correct / Math.max(1, stats.answered)) * 100);

  if (gameState === 'gameover') {
    return (
      <GameResult
        gameId="ganpati-logic"
        gameName="Ganpati Logic"
        difficulty={difficulty}
        score={score}
        bestScore={Math.max(score, bestScore)}
        isPersonalBest={progressionResult?.isTierPB || progressionResult?.isGlobalPB}
        newlyUnlockedTier={progressionResult?.newlyUnlockedTier}
        scoreBreakdown={{
          base: rawScore,
          accuracy: accuracy,
          maxCombo: maxStreak,
          multiplier: DIFFICULTY_TIERS[difficulty]?.multiplierLabel,
        }}
        stats={{
          answered: stats.answered,
          accuracy: `${accuracy}%`,
          maxStreak: `${maxStreak}x`,
        }}
        onRestart={handleStart}
        onNextDifficulty={(nextTier) => {
          handleDifficultyChange(nextTier);
          handleStart();
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 88px)',
        background:
          'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(168,85,247,0.15), transparent 60%), linear-gradient(180deg, #140a2e 0%, #200835 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Sound Toggle */}
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
          onClick={() => setSoundEnabledState((p) => !p)}
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
            color: soundEnabled ? '#C084FC' : 'var(--text-muted, #9CA3AF)',
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <PauseOverlay
            gameId="ganpati-logic"
            onResume={() => setIsPaused(false)}
            onRestart={() => {
              setIsPaused(false);
              handleStart();
            }}
            onToggleSound={() => setSoundEnabledState((p) => !p)}
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
            <div style={{ fontSize: '3.2rem', filter: 'drop-shadow(0 0 16px rgba(168,85,247,0.5))' }}>
              🧠
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #A855F7, #38BDF8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}
              >
                GANPATI LOGIC
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
                Infinite procedural puzzles! Test sequences, 2x2 matrix reasoning, festive deductions, and odd-one-out rules under rapid fire.
              </p>
            </div>

            {/* Difficulty Selector */}
            <div style={{ width: '100%' }}>
              <DifficultySelector
                gameId="ganpati-logic"
                selectedTier={difficulty}
                onChange={handleDifficultyChange}
                compact={true}
                showDescription={true}
              />
            </div>

            <button
              onClick={handleStart}
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: '1.1rem',
                padding: '0.85rem 2.5rem',
                borderRadius: 'var(--radius-xl, 12px)',
                border: 'none',
                background: 'linear-gradient(135deg, #A855F7, #38BDF8)',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
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
        {gameState === 'playing' && currentQ && (
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
              gap: '0.9rem',
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
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#A855F7' }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STREAK</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: streak >= 3 ? '#F59E0B' : '#F3F4F6' }}>
                  {streak}x
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACCURACY</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#38BDF8' }}>{accuracy}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MATCH TIME</div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: timeLeft <= 10 ? '#EF4444' : '#F3F4F6',
                  }}
                >
                  {timeLeft}s
                </div>
              </div>
            </div>

            {/* Question Blitz Timer Bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (qTimeLeft / tier.questionTime) * 100)}%`,
                  background: qTimeLeft <= 1.5 ? '#EF4444' : 'linear-gradient(90deg, #A855F7, #38BDF8)',
                  transition: 'width 0.2s linear',
                }}
              />
            </div>

            {/* Question Card */}
            <div
              style={{
                width: '100%',
                background: 'rgba(15,10,35,0.85)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 'var(--radius-xl, 16px)',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#A855F7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {currentQ.title}
              </span>

              <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentQ.display}
              </div>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {currentQ.ruleText}
              </span>
            </div>

            {/* Options Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                width: '100%',
              }}
            >
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                let bg = 'rgba(255,255,255,0.05)';
                let border = '1px solid rgba(255,255,255,0.15)';

                if (isSelected) {
                  if (feedback === 'correct') {
                    bg = 'rgba(16,185,129,0.25)';
                    border = '2px solid #10B981';
                  } else if (feedback === 'wrong') {
                    bg = 'rgba(239,68,68,0.25)';
                    border = '2px solid #EF4444';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswerSelect(idx)}
                    style={{
                      padding: '1rem 0.75rem',
                      background: bg,
                      border: border,
                      borderRadius: 'var(--radius-lg, 12px)',
                      color: '#F3F4F6',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      cursor: feedback === null ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {opt}
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

const matrixCellStyle = {
  width: '64px',
  height: '64px',
  background: 'rgba(255,255,255,0.05)',
  border: '2px solid rgba(255,255,255,0.2)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.4rem',
  fontWeight: 800,
  fontFamily: 'var(--font-mono)',
  color: '#F3F4F6',
};
