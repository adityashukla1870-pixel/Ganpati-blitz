import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer, Circle, Star, AlertTriangle, Volume2, VolumeX, Flame, Shield, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Countdown from '../../components/Countdown';
import GameResult from '../shared/GameResult';
import DifficultySelector from '../../components/DifficultySelector';
import PauseOverlay from '../../components/PauseOverlay';
import { getBestScore, setBestScore, getSoundEnabled, setSoundEnabled, getPlayer } from '../../utils/storage';
import { getSelectedDifficulty, setSelectedDifficulty, recordGameResult, getTierBestScore } from '../../utils/progression';
import { DIFFICULTY_TIERS } from '../../config/difficulties';
import { submitScore } from '../../services/api';

const CELL_TYPES = {
  WALL: 0,
  PATH: 1,
  START: 2,
  GOAL: 3,
  BONUS: 4,
  TRAP: 5,
  CRACKED: 6,
  HOLE: 7,
};

const TIER_PARAMS = {
  easy: {
    gridSize: 9,
    timeLimit: 60,
    catsCount: 0,
    hasFogOfWar: false,
    fogRadius: 99,
    label: 'Easy (9x9)',
  },
  normal: {
    gridSize: 11,
    timeLimit: 55,
    catsCount: 0,
    hasFogOfWar: false,
    fogRadius: 99,
    label: 'Normal (11x11)',
  },
  hard: {
    gridSize: 13,
    timeLimit: 50,
    catsCount: 1,
    hasFogOfWar: false,
    fogRadius: 99,
    label: 'Hard (13x13 Cat Patrol)',
  },
  expert: {
    gridSize: 15,
    timeLimit: 45,
    catsCount: 2,
    hasFogOfWar: true,
    fogRadius: 3.5,
    label: 'Expert (15x15 Torchlight)',
  },
  master: {
    gridSize: 17,
    timeLimit: 40,
    catsCount: 3,
    hasFogOfWar: true,
    fogRadius: 2.5,
    label: 'Master (17x17 Labyrinth)',
  },
};

function generateProceduralMaze(N) {
  const grid = Array(N)
    .fill(null)
    .map(() => Array(N).fill(CELL_TYPES.WALL));

  function carve(x, y) {
    grid[y][x] = CELL_TYPES.PATH;
    const dirs = [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < N - 1 && ny > 0 && ny < N - 1 && grid[ny][nx] === CELL_TYPES.WALL) {
        grid[y + dy / 2][x + dx / 2] = CELL_TYPES.PATH;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  grid[1][1] = CELL_TYPES.START;
  grid[N - 2][N - 2] = CELL_TYPES.GOAL;

  // Place bonuses (Laddus)
  const bonusCount = Math.floor(N / 2);
  let placed = 0;
  while (placed < bonusCount) {
    const x = Math.floor(Math.random() * (N - 2)) + 1;
    const y = Math.floor(Math.random() * (N - 2)) + 1;
    if (grid[y][x] === CELL_TYPES.PATH && (x !== 1 || y !== 1)) {
      grid[y][x] = CELL_TYPES.BONUS;
      placed++;
    }
  }

  // Place crumbly traps
  const trapCount = Math.floor(N / 3);
  placed = 0;
  while (placed < trapCount) {
    const x = Math.floor(Math.random() * (N - 2)) + 1;
    const y = Math.floor(Math.random() * (N - 2)) + 1;
    if (grid[y][x] === CELL_TYPES.PATH && (x !== 1 || y !== 1)) {
      grid[y][x] = CELL_TYPES.TRAP;
      placed++;
    }
  }

  return grid;
}

export default function MushakMaze({ player }) {
  const [searchParams] = useSearchParams();
  const [difficulty, setDifficulty] = useState(() => {
    const p = searchParams.get('diff');
    return p && TIER_PARAMS[p] ? p : getSelectedDifficulty('mushak-maze');
  });

  const tier = TIER_PARAMS[difficulty] || TIER_PARAMS.normal;
  const diffMultiplier = DIFFICULTY_TIERS[difficulty]?.multiplier || 1.5;

  const navigate = useNavigate();
  const [gameState, setGameState] = useState(() => {
    return searchParams.get('autostart') === '1' ? 'countdown' : 'idle';
  });
  const [isPaused, setIsPaused] = useState(false);
  const [maze, setMaze] = useState(() => generateProceduralMaze(tier.gridSize));
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [cats, setCats] = useState([]);
  const [lives, setLives] = useState(3);
  const [rawScore, setRawScore] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(tier.timeLimit);
  const [mazesCompleted, setMazesCompleted] = useState(0);
  const [bonusesCollected, setBonusesCollected] = useState(0);
  const [bestScore, setBestScoreState] = useState(() => getTierBestScore('mushak-maze', difficulty) || getBestScore('mushak-maze') || 0);
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());
  const [progressionResult, setProgressionResult] = useState(null);

  const timerRef = useRef(null);
  const catIntervalRef = useRef(null);
  const rawScoreRef = useRef(0);
  const statsRef = useRef({ bonuses: 0, mazes: 0 });

  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'bonus') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'goal') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } else if (type === 'cat' || type === 'trap') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (e) {}
    },
    [soundEnabled]
  );

  const handleDifficultyChange = (newTier) => {
    setDifficulty(newTier);
    setSelectedDifficulty('mushak-maze', newTier);
    const cfg = TIER_PARAMS[newTier] || TIER_PARAMS.normal;
    setMaze(generateProceduralMaze(cfg.gridSize));
    setBestScoreState(getTierBestScore('mushak-maze', newTier));
  };

  const spawnCatsForMaze = (grid, count) => {
    const N = grid.length;
    const spawned = [];
    while (spawned.length < count) {
      const cx = Math.floor(Math.random() * (N - 4)) + 3;
      const cy = Math.floor(Math.random() * (N - 4)) + 3;
      if (grid[cy][cx] === CELL_TYPES.PATH && !spawned.some((c) => c.x === cx && c.y === cy)) {
        spawned.push({ id: spawned.length, x: cx, y: cy, dir: [0, 1] });
      }
    }
    return spawned;
  };

  const startNewMazeLevel = useCallback(() => {
    const newGrid = generateProceduralMaze(tier.gridSize);
    setMaze(newGrid);
    setPlayerPos({ x: 1, y: 1 });
    if (tier.catsCount > 0) {
      setCats(spawnCatsForMaze(newGrid, tier.catsCount));
    } else {
      setCats([]);
    }
  }, [tier]);

  const handleGameOver = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (catIntervalRef.current) clearInterval(catIntervalRef.current);

    const finalScore = Math.round(rawScoreRef.current * diffMultiplier);
    const progRes = recordGameResult('mushak-maze', difficulty, finalScore);
    setProgressionResult(progRes);

    setBestScoreState(Math.max(finalScore, bestScore));
    setScore(finalScore);

    if (player?.player_id) {
      submitScore(player.player_id, finalScore, tier.timeLimit - timeLeft, { game_id: 'mushak-maze' }).catch(() => {});
    }
    setGameState('gameover');
  }, [diffMultiplier, difficulty, bestScore, player, tier.timeLimit, timeLeft]);

  // Movement logic
  const movePlayer = useCallback(
    (dx, dy) => {
      if (gameState !== 'playing') return;

      setPlayerPos((prev) => {
        const nx = prev.x + dx;
        const ny = prev.y + dy;
        const N = tier.gridSize;

        if (nx < 0 || nx >= N || ny < 0 || ny >= N) return prev;

        const cell = maze[ny][nx];
        if (cell === CELL_TYPES.WALL || cell === CELL_TYPES.HOLE) return prev;

        // Laddus bonus
        if (cell === CELL_TYPES.BONUS) {
          playSound('bonus');
          rawScoreRef.current += 60;
          setBonusesCollected((b) => b + 1);
          statsRef.current.bonuses++;
          setMaze((m) => {
            const next = m.map((r) => [...r]);
            next[ny][nx] = CELL_TYPES.PATH;
            return next;
          });
        }
        // Crumbly Floor Traps
        else if (cell === CELL_TYPES.TRAP) {
          playSound('trap');
          setMaze((m) => {
            const next = m.map((r) => [...r]);
            next[ny][nx] = CELL_TYPES.CRACKED;
            return next;
          });
        } else if (cell === CELL_TYPES.CRACKED) {
          playSound('trap');
          setMaze((m) => {
            const next = m.map((r) => [...r]);
            next[ny][nx] = CELL_TYPES.HOLE;
            return next;
          });
        }
        // Golden Goal Modak
        else if (cell === CELL_TYPES.GOAL) {
          playSound('goal');
          const timeBonus = Math.max(10, timeLeft * 4);
          rawScoreRef.current += 250 + timeBonus;
          setMazesCompleted((m) => m + 1);
          statsRef.current.mazes++;
          startNewMazeLevel();
          return { x: 1, y: 1 };
        }

        const total = Math.round(rawScoreRef.current * diffMultiplier);
        setRawScore(rawScoreRef.current);
        setScore(total);

        // Check if player walked into a cat
        if (cats.some((c) => c.x === nx && c.y === ny)) {
          playSound('cat');
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) setTimeout(() => handleGameOver(), 200);
            return nextL;
          });
        }

        return { x: nx, y: ny };
      });
    },
    [gameState, tier.gridSize, maze, playSound, timeLeft, diffMultiplier, startNewMazeLevel, cats, handleGameOver]
  );

  // Cat Patrol Movement AI
  useEffect(() => {
    if (gameState !== 'playing' || tier.catsCount === 0) return;

    catIntervalRef.current = setInterval(() => {
      setCats((prevCats) =>
        prevCats.map((cat) => {
          const dirs = [
            [0, -1],
            [0, 1],
            [-1, 0],
            [1, 0],
          ];
          const validDirs = dirs.filter(([dx, dy]) => {
            const nx = cat.x + dx;
            const ny = cat.y + dy;
            return (
              nx > 0 &&
              nx < tier.gridSize - 1 &&
              ny > 0 &&
              ny < tier.gridSize - 1 &&
              maze[ny][nx] !== CELL_TYPES.WALL &&
              maze[ny][nx] !== CELL_TYPES.HOLE
            );
          });

          if (validDirs.length === 0) return cat;

          // Bias towards player
          let chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
          const dxToPlayer = playerPos.x - cat.x;
          const dyToPlayer = playerPos.y - cat.y;

          for (const d of validDirs) {
            if ((d[0] === Math.sign(dxToPlayer) && dxToPlayer !== 0) || (d[1] === Math.sign(dyToPlayer) && dyToPlayer !== 0)) {
              if (Math.random() < 0.6) {
                chosen = d;
                break;
              }
            }
          }

          const nx = cat.x + chosen[0];
          const ny = cat.y + chosen[1];

          // Check collision with player
          if (nx === playerPos.x && ny === playerPos.y) {
            playSound('cat');
            setLives((l) => {
              const nextL = l - 1;
              if (nextL <= 0) setTimeout(() => handleGameOver(), 200);
              return nextL;
            });
          }

          return { ...cat, x: nx, y: ny };
        })
      );
    }, 700);

    return () => clearInterval(catIntervalRef.current);
  }, [gameState, tier.catsCount, tier.gridSize, maze, playerPos, playSound, handleGameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        movePlayer(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        movePlayer(1, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, handleGameOver]);

  const handleStart = () => {
    setGameState('countdown');
    setRawScore(0);
    rawScoreRef.current = 0;
    setScore(0);
    setTimeLeft(tier.timeLimit);
    setMazesCompleted(0);
    setBonusesCollected(0);
    setLives(3);
    statsRef.current = { bonuses: 0, mazes: 0 };
    startNewMazeLevel();
  };

  const handleCountdownComplete = () => {
    setGameState('playing');
  };

  const cellSize = Math.min(36, Math.floor(340 / tier.gridSize));

  if (gameState === 'gameover') {
    return (
      <GameResult
        gameId="mushak-maze"
        gameName="Mushak Maze"
        difficulty={difficulty}
        score={score}
        bestScore={Math.max(score, bestScore)}
        isPersonalBest={progressionResult?.isTierPB || progressionResult?.isGlobalPB}
        newlyUnlockedTier={progressionResult?.newlyUnlockedTier}
        scoreBreakdown={{
          base: rawScore,
          mazes: mazesCompleted,
          maxCombo: bonusesCollected,
          multiplier: DIFFICULTY_TIERS[difficulty]?.multiplierLabel,
        }}
        stats={{
          mazesSolved: mazesCompleted,
          laddusEaten: bonusesCollected,
          livesRemaining: lives,
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
          'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(245,158,11,0.12), transparent 60%), linear-gradient(180deg, #140a2e 0%, #200a30 100%)',
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
            color: soundEnabled ? '#F59E0B' : 'var(--text-muted, #9CA3AF)',
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <PauseOverlay
            gameId="mushak-maze"
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
            <div style={{ fontSize: '3.2rem', filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.5))' }}>
              🐭
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #F59E0B, #10B981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}
              >
                MUSHAK MAZE
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
                Guide Mushak through dynamic mazes! Collect sacred laddus, avoid crumbly floor traps, and dodge patrol cats in the dark!
              </p>
            </div>

            {/* Difficulty Selector */}
            <div style={{ width: '100%' }}>
              <DifficultySelector
                gameId="mushak-maze"
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
                background: 'linear-gradient(135deg, #F59E0B, #10B981)',
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

        {/* Playing Phase */}
        {gameState === 'playing' && (
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
              gap: '0.75rem',
              flex: 1,
            }}
          >
            {/* Top HUD */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 'var(--radius-xl, 12px)',
                padding: '0.6rem 0.85rem',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F59E0B' }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MAZES</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10B981' }}>{mazesCompleted}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LIVES</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#EF4444' }}>
                  {'❤️'.repeat(lives)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TIME</div>
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

            {/* Maze Board */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${tier.gridSize}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${tier.gridSize}, ${cellSize}px)`,
                gap: '1px',
                padding: '6px',
                background: '#0B081A',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: '0 0 25px rgba(0,0,0,0.7)',
                position: 'relative',
              }}
            >
              {maze.map((row, y) =>
                row.map((cell, x) => {
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const isCat = cats.some((c) => c.x === x && c.y === y);

                  // Fog of war check
                  let inLight = true;
                  if (tier.hasFogOfWar) {
                    const dist = Math.hypot(x - playerPos.x, y - playerPos.y);
                    inLight = dist <= tier.fogRadius;
                  }

                  let bg = '#181433';
                  if (!inLight) {
                    bg = '#05030B';
                  } else if (cell === CELL_TYPES.WALL) {
                    bg = '#140E26';
                  } else if (cell === CELL_TYPES.HOLE) {
                    bg = '#080512';
                  } else if (cell === CELL_TYPES.CRACKED) {
                    bg = '#451A03';
                  } else if (cell === CELL_TYPES.TRAP) {
                    bg = '#3F1212';
                  } else {
                    bg = '#251E45';
                  }

                  return (
                    <div
                      key={`${x}-${y}`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: `${cellSize * 0.75}px`,
                        borderRadius: cell === CELL_TYPES.WALL ? 2 : 3,
                        transition: 'background 0.2s',
                        position: 'relative',
                      }}
                    >
                      {inLight && (
                        <>
                          {isPlayer && <span>🐭</span>}
                          {!isPlayer && isCat && <span>🐱</span>}
                          {!isPlayer && !isCat && cell === CELL_TYPES.GOAL && <span>🥮</span>}
                          {!isPlayer && !isCat && cell === CELL_TYPES.BONUS && <span>🟡</span>}
                          {!isPlayer && !isCat && cell === CELL_TYPES.TRAP && <span>⚠️</span>}
                          {!isPlayer && !isCat && cell === CELL_TYPES.CRACKED && (
                            <span style={{ fontSize: `${cellSize * 0.5}px` }}>🕸️</span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Virtual D-Pad for Touch/Mobile */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 56px)',
                gridTemplateRows: 'repeat(3, 50px)',
                gap: '4px',
                marginTop: '0.25rem',
                justifyContent: 'center',
              }}
            >
              <div />
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  movePlayer(0, -1);
                }}
                style={dpadBtnStyle}
              >
                <ArrowUp size={22} />
              </button>
              <div />

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  movePlayer(-1, 0);
                }}
                style={dpadBtnStyle}
              >
                <ArrowLeft size={22} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>D-PAD</span>
              </div>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  movePlayer(1, 0);
                }}
                style={dpadBtnStyle}
              >
                <ArrowRight size={22} />
              </button>

              <div />
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  movePlayer(0, 1);
                }}
                style={dpadBtnStyle}
              >
                <ArrowDown size={22} />
              </button>
              <div />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const dpadBtnStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '10px',
  color: '#F3F4F6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  touchAction: 'manipulation',
};
