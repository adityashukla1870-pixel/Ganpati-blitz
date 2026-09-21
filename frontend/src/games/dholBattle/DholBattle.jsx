import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Drum, Music, Zap, Skull, Pause } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Countdown from '../../components/Countdown';
import GameResult from '../shared/GameResult';
import DifficultySelector from '../../components/DifficultySelector';
import PauseOverlay from '../../components/PauseOverlay';
import { getBestScore, setBestScore, getSoundEnabled, setSoundEnabled, getPlayer, setUniversalPoints } from '../../utils/storage';
import { getSelectedDifficulty, setSelectedDifficulty, recordGameResult, getTierBestScore } from '../../utils/progression';
import { DIFFICULTY_TIERS } from '../../config/difficulties';
import { submitScore } from '../../services/api';
import { triggerHaptic } from '../../utils/haptics';

const GAME_DURATION = 40;

const TIER_PARAMS = {
  easy: {
    lanes: 2,
    laneKeys: ['F', 'J'],
    scrollDurationBase: 2100,
    scrollDurationMin: 1650,
    spawnIntervalBase: 880,
    spawnIntervalMin: 600,
    perfectWindow: 65,
    goodWindow: 135,
    ghostChance: 0,
    label: 'Easy (90 BPM)',
  },
  normal: {
    lanes: 3,
    laneKeys: ['D', 'F', 'J'],
    scrollDurationBase: 1750,
    scrollDurationMin: 1300,
    spawnIntervalBase: 720,
    spawnIntervalMin: 480,
    perfectWindow: 50,
    goodWindow: 110,
    ghostChance: 0,
    label: 'Normal (120 BPM)',
  },
  hard: {
    lanes: 4,
    laneKeys: ['D', 'F', 'J', 'K'],
    scrollDurationBase: 1450,
    scrollDurationMin: 1050,
    spawnIntervalBase: 580,
    spawnIntervalMin: 360,
    perfectWindow: 40,
    goodWindow: 85,
    ghostChance: 0.12,
    label: 'Hard (145 BPM)',
  },
  expert: {
    lanes: 4,
    laneKeys: ['D', 'F', 'J', 'K'],
    scrollDurationBase: 1200,
    scrollDurationMin: 850,
    spawnIntervalBase: 440,
    spawnIntervalMin: 280,
    perfectWindow: 34,
    goodWindow: 70,
    ghostChance: 0.18,
    label: 'Expert (170 BPM)',
  },
  master: {
    lanes: 4,
    laneKeys: ['D', 'F', 'J', 'K'],
    scrollDurationBase: 1000,
    scrollDurationMin: 700,
    spawnIntervalBase: 350,
    spawnIntervalMin: 210,
    perfectWindow: 26,
    goodWindow: 55,
    ghostChance: 0.24,
    label: 'Master (195 BPM)',
  },
};

const LANE_COLORS = ['#ff6b35', '#f59e0b', '#38bdf8', '#a855f7'];

export default function DholBattle({ player }) {
  const [searchParams] = useSearchParams();
  const [difficulty, setDifficulty] = useState(() => {
    const p = searchParams.get('diff');
    return p && TIER_PARAMS[p] ? p : getSelectedDifficulty('dhol-battle');
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
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [beats, setBeats] = useState([]);
  const [laneFlashes, setLaneFlashes] = useState([null, null, null, null]);
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());
  const [remainingTime, setRemainingTime] = useState(GAME_DURATION);
  const [feedbackTexts, setFeedbackTexts] = useState([]);
  const [bestScore, setBestScoreState] = useState(() => getTierBestScore('dhol-battle', difficulty) || getBestScore('dhol-battle') || 0);
  const [stats, setStats] = useState({ perfect: 0, good: 0, miss: 0, dodgedGhosts: 0 });
  const [progressionResult, setProgressionResult] = useState(null);

  const gameStartTime = useRef(null);
  const lastSpawnTime = useRef(0);
  const beatIdCounter = useRef(0);
  const animFrameRef = useRef(null);
  const gameTimerRef = useRef(null);
  const beatsRef = useRef([]);
  const rawScoreRef = useRef(0);
  const comboRef = useRef(0);
  const statsRef = useRef({ perfect: 0, good: 0, miss: 0, dodgedGhosts: 0 });

  const playSound = useCallback(
    (type, laneIndex = 0) => {
      if (!soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'perfect') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'good') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        } else if (type === 'dhol') {
          // Booming Dhol Bass
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140 + laneIndex * 20, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'miss' || type === 'demon') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(130, ctx.currentTime);
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch (e) {}
    },
    [soundEnabled]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  const handleDifficultyChange = (newTier) => {
    setDifficulty(newTier);
    setSelectedDifficulty('dhol-battle', newTier);
    setBestScoreState(getTierBestScore('dhol-battle', newTier));
  };

  const getComboMultiplier = (c) => {
    if (c >= 25) return 3.0;
    if (c >= 15) return 2.2;
    if (c >= 8) return 1.6;
    if (c >= 4) return 1.3;
    return 1.0;
  };

  const addFeedbackText = useCallback((text, color) => {
    const id = Date.now() + Math.random();
    setFeedbackTexts((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setFeedbackTexts((prev) => prev.filter((f) => f.id !== id));
    }, 700);
  }, []);

  const spawnBeat = useCallback(
    (currentTime) => {
      if (!gameStartTime.current) return;
      const elapsed = (currentTime - gameStartTime.current) / 1000;
      const progress = Math.min(1, elapsed / GAME_DURATION);

      const spawnInterval =
        tier.spawnIntervalBase - (tier.spawnIntervalBase - tier.spawnIntervalMin) * progress;
      const scrollDuration =
        tier.scrollDurationBase - (tier.scrollDurationBase - tier.scrollDurationMin) * progress;

      if (currentTime - lastSpawnTime.current >= spawnInterval) {
        lastSpawnTime.current = currentTime;
        const lane = Math.floor(Math.random() * tier.lanes);
        const isGhost = tier.ghostChance > 0 && Math.random() < tier.ghostChance;

        const newBeat = {
          id: beatIdCounter.current++,
          lane,
          isGhost,
          spawnTime: currentTime,
          hitTime: currentTime + scrollDuration,
          scrollDuration,
        };
        beatsRef.current = [...beatsRef.current, newBeat];
        setBeats([...beatsRef.current]);
      }
    },
    [tier]
  );

  const checkBeatHit = useCallback(
    (laneIndex) => {
      if (gameState !== 'playing') return;
      const now = performance.now();

      // Find beats in this lane within good window
      const laneBeats = beatsRef.current.filter(
        (b) =>
          b.lane === laneIndex &&
          b.hitTime > now - tier.goodWindow &&
          b.hitTime < now + tier.goodWindow
      );

      if (laneBeats.length === 0) {
        // Empty lane tap
        comboRef.current = 0;
        setCombo(0);
        addFeedbackText('MISS', '#EF4444');
        playSound('miss');
        triggerHaptic('warning');
        setLaneFlashes((prev) => {
          const next = [...prev];
          next[laneIndex] = 'miss';
          return next;
        });
        setTimeout(() => {
          setLaneFlashes((prev) => {
            const next = [...prev];
            next[laneIndex] = null;
            return next;
          });
        }, 200);
        statsRef.current.miss++;
        setStats({ ...statsRef.current });
        return;
      }

      // Pick closest beat
      const closest = laneBeats.reduce((c, b) =>
        Math.abs(b.hitTime - now) < Math.abs(c.hitTime - now) ? b : c
      );
      const timeDiff = Math.abs(closest.hitTime - now);

      // Remove from active beats
      beatsRef.current = beatsRef.current.filter((b) => b.id !== closest.id);
      setBeats([...beatsRef.current]);

      // Demon Ghost Beat hit penalty
      if (closest.isGhost) {
        comboRef.current = 0;
        setCombo(0);
        rawScoreRef.current = Math.max(0, rawScoreRef.current - 120);
        const total = Math.round(rawScoreRef.current * diffMultiplier);
        setRawScore(rawScoreRef.current);
        setScore(total);
        addFeedbackText('DEMON BEAT!', '#DC2626');
        playSound('demon');
        triggerHaptic('danger');
        statsRef.current.miss++;
        setStats({ ...statsRef.current });
        setLaneFlashes((prev) => {
          const next = [...prev];
          next[laneIndex] = 'miss';
          return next;
        });
        setTimeout(() => {
          setLaneFlashes((prev) => {
            const next = [...prev];
            next[laneIndex] = null;
            return next;
          });
        }, 250);
        return;
      }

      // Normal beat scoring
      let quality = 'GOOD';
      let pts = 60;
      let color = '#22C55E';

      if (timeDiff <= tier.perfectWindow) {
        quality = 'PERFECT';
        pts = 100;
        color = '#FFD700';
        playSound('perfect');
        triggerHaptic('success');
        statsRef.current.perfect++;
      } else {
        playSound('good');
        triggerHaptic('light');
        statsRef.current.good++;
      }

      playSound('dhol', laneIndex);

      comboRef.current += 1;
      const c = comboRef.current;
      setMaxCombo((prev) => Math.max(prev, c));
      setCombo(c);

      const mult = getComboMultiplier(c);
      rawScoreRef.current += Math.round(pts * mult);
      const updatedTotal = Math.round(rawScoreRef.current * diffMultiplier);
      setRawScore(rawScoreRef.current);
      setScore(updatedTotal);
      setStats({ ...statsRef.current });

      addFeedbackText(quality, color);

      setLaneFlashes((prev) => {
        const next = [...prev];
        next[laneIndex] = quality.toLowerCase();
        return next;
      });
      setTimeout(() => {
        setLaneFlashes((prev) => {
          const next = [...prev];
          next[laneIndex] = null;
          return next;
        });
      }, 200);
    },
    [gameState, tier, diffMultiplier, addFeedbackText, playSound]
  );

  const startGame = useCallback(() => {
    setScore(0);
    setRawScore(0);
    rawScoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    setBeats([]);
    beatsRef.current = [];
    setFeedbackTexts([]);
    setRemainingTime(GAME_DURATION);
    statsRef.current = { perfect: 0, good: 0, miss: 0, dodgedGhosts: 0 };
    setStats({ ...statsRef.current });
    beatIdCounter.current = 0;
    setGameState('countdown');
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setGameState('playing');
    gameStartTime.current = performance.now();
    lastSpawnTime.current = 0;
  }, []);

  const endGame = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    const finalScore = Math.round(rawScoreRef.current * diffMultiplier);
    const progRes = recordGameResult('dhol-battle', difficulty, finalScore);
    setProgressionResult(progRes);

    setBestScoreState(Math.max(finalScore, bestScore));
    setScore(finalScore);

    if (player?.player_id) {
      submitScore(player.player_id, finalScore, GAME_DURATION, { game_id: 'dhol-battle' })
        .then((res) => {
          if (res?.new_universal_points !== undefined) {
            setUniversalPoints(res.new_universal_points);
          }
        })
        .catch(() => {});
    }
    setGameState('gameover');
  }, [diffMultiplier, difficulty, bestScore, player]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = (timestamp) => {
      if (!gameStartTime.current) return;
      const elapsed = (timestamp - gameStartTime.current) / 1000;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setRemainingTime(Math.ceil(remaining));

      if (remaining <= 0) {
        endGame();
        return;
      }

      spawnBeat(timestamp);

      // Clean up past beats; reward dodging demon ghost notes!
      const now = performance.now();
      beatsRef.current = beatsRef.current.filter((b) => {
        const progress = (now - b.spawnTime) / b.scrollDuration;
        if (progress > 1.15) {
          if (b.isGhost) {
            // Player successfully let the ghost note pass!
            statsRef.current.dodgedGhosts++;
            rawScoreRef.current += 30;
          } else {
            // Missed normal note
            comboRef.current = 0;
            setCombo(0);
            statsRef.current.miss++;
          }
          return false;
        }
        return true;
      });

      setBeats([...beatsRef.current]);
      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, spawnBeat, endGame]);

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e) => {
      if (gameState !== 'playing') return;
      const k = e.key.toUpperCase();
      const laneIdx = tier.laneKeys.indexOf(k);
      if (laneIdx !== -1) {
        checkBeatHit(laneIdx);
      }
    },
    [gameState, tier.laneKeys, checkBeatHit]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleRestart = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    setGameState('idle');
    setScore(0);
    setRawScore(0);
    rawScoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    setBeats([]);
    beatsRef.current = [];
    setFeedbackTexts([]);
    setRemainingTime(GAME_DURATION);
  }, []);

  const totalHits = stats.perfect + stats.good;
  const accuracy = Math.round((totalHits / Math.max(1, totalHits + stats.miss)) * 100);

  if (gameState === 'gameover') {
    return (
      <GameResult
        gameId="dhol-battle"
        gameIcon={<Drum size={40} color="#ff6b35" />}
        gameName="Dhol Battle"
        difficulty={difficulty}
        score={score}
        bestScore={Math.max(score, bestScore)}
        isPersonalBest={progressionResult?.isTierPB || progressionResult?.isGlobalPB}
        newlyUnlockedTier={progressionResult?.newlyUnlockedTier}
        scoreBreakdown={{
          base: rawScore,
          accuracy: accuracy,
          maxCombo: maxCombo,
          multiplier: DIFFICULTY_TIERS[difficulty]?.multiplierLabel,
        }}
        stats={{
          perfectHits: stats.perfect,
          goodHits: stats.good,
          misses: stats.miss,
          accuracy: `${accuracy}%`,
        }}
        onPlayAgain={handleRestart}
        onNextDifficulty={(nextTier) => {
          handleDifficultyChange(nextTier);
          handleRestart();
        }}
        leaderboardRoute="/leaderboard/dhol-battle"
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
        fontFamily: 'var(--font-sans)',
        color: 'var(--text)',
        position: 'relative',
        overflow: 'hidden',
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
            color: soundEnabled ? '#FFD700' : 'var(--text-muted, #9CA3AF)',
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <PauseOverlay
            gameId="dhol-battle"
            onResume={() => setIsPaused(false)}
            onRestart={() => {
              setIsPaused(false);
              startGame();
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
              flex: 1,
              gap: '1.25rem',
              textAlign: 'center',
              padding: '1.5rem',
              maxWidth: 440,
              margin: 'auto',
            }}
          >
            <motion.div
              style={{ fontSize: '3.5rem' }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Drum size={50} color="#ff6b35" />
            </motion.div>

            <div>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #ff6b35, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}
              >
                DHOL BATTLE
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
                Strike the festive beats in the target zone with precision timing! Avoid demon beats on Hard and above.
              </p>
            </div>

            {/* Difficulty Selector */}
            <div style={{ width: '100%' }}>
              <DifficultySelector
                gameId="dhol-battle"
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
                background: 'linear-gradient(135deg, #ff6b35, #f7931a)',
                color: '#0f0f23',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(255,107,53,0.4)',
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
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 88px)' }}
          >
            {/* Top HUD */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                background: 'rgba(15,15,35,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                zIndex: 10,
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: '#ff6b35' }}>
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>COMBO</div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    fontFamily: 'var(--font-mono)',
                    color: combo >= 15 ? '#ffd700' : combo >= 8 ? '#f59e0b' : '#22c55e',
                  }}
                >
                  {combo}x
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACCURACY</div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    fontFamily: 'var(--font-mono)',
                    color: accuracy >= 80 ? '#22c55e' : '#f59e0b',
                  }}
                >
                  {accuracy}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TIME</div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    fontFamily: 'var(--font-mono)',
                    color: remainingTime <= 10 ? '#ef4444' : '#F3F4F6',
                  }}
                >
                  {remainingTime}s
                </div>
              </div>
            </div>

            {/* Note Tracks Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {/* Strike Zone Target Line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '64px',
                  background: 'linear-gradient(90deg, rgba(255,215,0,0.35), transparent)',
                  borderRight: '3px solid #ffd700',
                  boxShadow: '0 0 30px rgba(255,215,0,0.4), inset 0 0 30px rgba(255,215,0,0.1)',
                  zIndex: 2,
                }}
              />

              {/* Lane dividing rows */}
              {Array.from({ length: tier.lanes }).map((_, laneIndex) => {
                const laneHeightPercent = 100 / tier.lanes;
                return (
                  <div
                    key={laneIndex}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${laneIndex * laneHeightPercent}%`,
                      height: `${laneHeightPercent}%`,
                      borderBottom: laneIndex < tier.lanes - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      background:
                        laneFlashes[laneIndex] === 'perfect'
                          ? 'rgba(255,215,0,0.3)'
                          : laneFlashes[laneIndex] === 'good'
                          ? 'rgba(34,197,94,0.3)'
                          : laneFlashes[laneIndex] === 'miss'
                          ? 'rgba(239,68,68,0.25)'
                          : 'transparent',
                      transition: 'background 0.12s',
                    }}
                  />
                );
              })}

              {/* Flowing Beats */}
              {beats.map((beat) => {
                const now = performance.now();
                const progress = (now - beat.spawnTime) / beat.scrollDuration;
                if (progress < 0 || progress > 1.25) return null;

                const x = 64 + (window.innerWidth - 64) * (1 - progress);
                const laneHeightPercent = 100 / tier.lanes;
                const topPercent = (beat.lane + 0.5) * laneHeightPercent;

                return (
                  <motion.div
                    key={beat.id}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${topPercent}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: beat.isGhost
                        ? 'radial-gradient(circle, #EF4444, #7F1D1D)'
                        : `radial-gradient(circle, ${LANE_COLORS[beat.lane % LANE_COLORS.length]}, #B45309)`,
                      boxShadow: beat.isGhost
                        ? '0 0 20px rgba(239,68,68,0.8)'
                        : `0 0 20px ${LANE_COLORS[beat.lane % LANE_COLORS.length]}88`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 3,
                      border: beat.isGhost ? '2px solid #EF4444' : '2px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    {beat.isGhost ? (
                      <Skull size={22} color="#fff" />
                    ) : beat.lane % 2 === 0 ? (
                      <Drum size={22} color="#fff" />
                    ) : (
                      <Zap size={20} color="#fff" />
                    )}
                  </motion.div>
                );
              })}

              {/* Feedback Popups (PERFECT / GOOD / MISS) */}
              <AnimatePresence>
                {feedbackTexts.map((fb) => (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -50, scale: 1.25 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      position: 'absolute',
                      left: '80px',
                      top: '45%',
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono)',
                      color: fb.color,
                      textShadow: `0 0 20px ${fb.color}`,
                      zIndex: 15,
                      pointerEvents: 'none',
                    }}
                  >
                    {fb.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Bottom Tap Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${tier.lanes}, 1fr)`,
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'rgba(15,15,35,0.98)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                zIndex: 10,
              }}
            >
              {Array.from({ length: tier.lanes }).map((_, laneIndex) => (
                <button
                  key={laneIndex}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    checkBeatHit(laneIndex);
                  }}
                  style={{
                    height: '64px',
                    borderRadius: 'var(--radius-lg, 10px)',
                    border: `2px solid ${LANE_COLORS[laneIndex % LANE_COLORS.length]}88`,
                    background:
                      laneFlashes[laneIndex] === 'perfect'
                        ? 'rgba(255,215,0,0.4)'
                        : laneFlashes[laneIndex] === 'good'
                        ? 'rgba(34,197,94,0.4)'
                        : laneFlashes[laneIndex] === 'miss'
                        ? 'rgba(239,68,68,0.35)'
                        : 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                    cursor: 'pointer',
                    color: '#fff',
                    touchAction: 'manipulation',
                  }}
                >
                  <Drum size={22} style={{ color: LANE_COLORS[laneIndex % LANE_COLORS.length] }} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#F3F4F6',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {tier.laneKeys[laneIndex]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
