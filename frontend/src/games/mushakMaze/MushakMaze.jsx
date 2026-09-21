import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Countdown from '../../components/Countdown';
import GameResult from '../shared/GameResult';
import DifficultySelector from '../../components/DifficultySelector';
import PauseOverlay from '../../components/PauseOverlay';
import { getBestScore, getSoundEnabled, setSoundEnabled, setUniversalPoints } from '../../utils/storage';
import { getSelectedDifficulty, setSelectedDifficulty, recordGameResult, getTierBestScore } from '../../utils/progression';
import { DIFFICULTY_TIERS } from '../../config/difficulties';
import { submitScore } from '../../services/api';

// 19 cols x 21 rows symmetrical temple labyrinth
const MAP_TEMPLATE = [
  '###################',
  '#........#........#',
  '#O##.###.#.###.##O#',
  '#.##.###.#.###.##.#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '   #.#   C   #.#   ',
  '####.# ##-## #.####',
  'T   .  #CCC#  .   T',
  '####.# ##### #.####',
  '   #.#       #.#   ',
  '####.# ##### #.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#O.#.....M.....#.O#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '###################',
];

const COLS = 19;
const ROWS = 21;

const CELL = {
  EMPTY: 0,
  WALL: 1,
  DOT: 2,
  POWER: 3,
  DOOR: 4,
  TUNNEL: 5,
};

const CAT_COLORS = [
  { name: 'Marjar', color: '#FF8C00', homeX: 9, homeY: 8 },
  { name: 'Shyama', color: '#A855F7', homeX: 8, homeY: 10 },
  { name: 'Pinku',  color: '#EC4899', homeX: 9, homeY: 10 },
  { name: 'Neelu',  color: '#06B6D4', homeX: 10, homeY: 10 },
];

const TIER_PARAMS = {
  easy: {
    label: 'Easy (1 Cat)',
    catsCount: 1,
    mushakSpeed: 4.2,
    catSpeed: 2.8,
    divineDuration: 10,
    timeLimit: 90,
  },
  normal: {
    label: 'Normal (2 Cats)',
    catsCount: 2,
    mushakSpeed: 4.6,
    catSpeed: 3.3,
    divineDuration: 8,
    timeLimit: 80,
  },
  hard: {
    label: 'Hard (3 Cats)',
    catsCount: 3,
    mushakSpeed: 5.0,
    catSpeed: 3.8,
    divineDuration: 6.5,
    timeLimit: 70,
  },
  expert: {
    label: 'Expert (4 Cats)',
    catsCount: 4,
    mushakSpeed: 5.4,
    catSpeed: 4.3,
    divineDuration: 5,
    timeLimit: 60,
  },
  master: {
    label: 'Master (4 Fast Cats)',
    catsCount: 4,
    mushakSpeed: 5.8,
    catSpeed: 4.8,
    divineDuration: 4,
    timeLimit: 50,
  },
};

function createInitialBoard(tier) {
  const grid = [];
  let dots = 0;
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = MAP_TEMPLATE[r][c];
      if (ch === '#') grid[r][c] = CELL.WALL;
      else if (ch === '.') {
        grid[r][c] = CELL.DOT;
        dots++;
      } else if (ch === 'O') {
        grid[r][c] = CELL.POWER;
        dots++;
      } else if (ch === '-') grid[r][c] = CELL.DOOR;
      else if (ch === 'T') grid[r][c] = CELL.TUNNEL;
      else grid[r][c] = CELL.EMPTY;
    }
  }

  const spawnedCats = [];
  for (let i = 0; i < tier.catsCount; i++) {
    const def = CAT_COLORS[i % CAT_COLORS.length];
    spawnedCats.push({
      id: i,
      name: def.name,
      color: def.color,
      x: def.homeX,
      y: def.homeY,
      dir: { x: 0, y: i === 0 ? -1 : 0 },
      speed: tier.catSpeed,
      state: i === 0 ? 'CHASE' : 'HOUSE',
      houseTimer: i * 3.5,
      target: { x: 9, y: 16 },
    });
  }

  return { grid, dots, spawnedCats };
}

export default function MushakMaze({ player }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState(() => {
    const p = searchParams.get('diff');
    return p && TIER_PARAMS[p] ? p : getSelectedDifficulty('mushak-maze');
  });

  const tier = TIER_PARAMS[difficulty] || TIER_PARAMS.normal;
  const diffMultiplier = DIFFICULTY_TIERS[difficulty]?.multiplier || 1.5;

  const [gameState, setGameState] = useState(() => {
    return searchParams.get('autostart') === '1' ? 'countdown' : 'idle';
  });
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [rawScore, setRawScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(tier.timeLimit);
  const [stage, setStage] = useState(1);
  const [divineTimeRemaining, setDivineTimeRemaining] = useState(0);
  const [bestScore, setBestScoreState] = useState(() => getTierBestScore('mushak-maze', difficulty) || getBestScore('mushak-maze') || 0);
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());
  const [progressionResult, setProgressionResult] = useState(null);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Initialize board immediately so grid is NEVER empty
  const initialDataRef = useRef(null);
  if (!initialDataRef.current) {
    initialDataRef.current = createInitialBoard(tier);
  }

  const engineRef = useRef({
    grid: initialDataRef.current.grid,
    dotsRemaining: initialDataRef.current.dots,
    mushak: {
      x: 9,
      y: 16,
      dir: { x: 0, y: 0 },
      nextDir: { x: -1, y: 0 },
      speed: tier.mushakSpeed,
      mouthAngle: 0.2,
      mouthSpeed: 12,
    },
    cats: initialDataRef.current.spawnedCats,
    divineTimer: 0,
    divineTotal: tier.divineDuration,
    catCombo: 0,
    particles: [],
    popups: [],
    fruit: null,
    fruitTimer: 15,
    lastTime: performance.now(),
    lives: 3,
    score: 0,
    rawScore: 0,
    stage: 1,
    gameOver: false,
    cleared: false,
    resetPause: 0,
  });

  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'munch') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.start(now);
          osc.stop(now + 0.07);
        } else if (type === 'divine') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now);
          osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === 'bonk') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(700, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'fruit') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(659.25, now);
          osc.frequency.setValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'hit') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === 'clear') {
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + idx * 0.1);
            g.gain.setValueAtTime(0.15, now + idx * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
            o.start(now + idx * 0.1);
            o.stop(now + idx * 0.1 + 0.25);
          });
        }
      } catch (e) {}
    },
    [soundEnabled]
  );

  const handleDifficultyChange = (newTier) => {
    setDifficulty(newTier);
    setSelectedDifficulty('mushak-maze', newTier);
    setBestScoreState(getTierBestScore('mushak-maze', newTier));
  };

  const handleGameOver = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const eng = engineRef.current;
    eng.gameOver = true;
    const finalScore = Math.round(eng.rawScore * diffMultiplier);

    const progRes = recordGameResult('mushak-maze', difficulty, finalScore);
    setProgressionResult(progRes);
    setBestScoreState(Math.max(finalScore, bestScore));
    setScore(finalScore);

    if (player?.player_id) {
      submitScore(player.player_id, finalScore, tier.timeLimit - timeLeft, {
        game_id: 'mushak-maze',
        difficulty,
        mazes_completed: eng.stage,
      })
        .then((res) => {
          if (res?.new_universal_points !== undefined) {
            setUniversalPoints(res.new_universal_points);
          }
        })
        .catch(() => {});
    }

    setGameState('gameover');
  }, [bestScore, diffMultiplier, difficulty, player, tier.timeLimit, timeLeft]);

  const requestDirection = useCallback((dx, dy) => {
    const eng = engineRef.current;
    if (eng.gameOver || gameState !== 'playing' || isPaused) return;

    if (dx === -eng.mushak.dir.x && dy === -eng.mushak.dir.y && (dx !== 0 || dy !== 0)) {
      eng.mushak.dir = { x: dx, y: dy };
      eng.mushak.nextDir = { x: dx, y: dy };
      return;
    }
    eng.mushak.nextDir = { x: dx, y: dy };
  }, [gameState, isPaused]);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      requestDirection(dx > 0 ? 1 : -1, 0);
    } else {
      requestDirection(0, dy > 0 ? 1 : -1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || isPaused) {
        if (e.key === 'Escape' && gameState === 'playing') setIsPaused((p) => !p);
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        requestDirection(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        requestDirection(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        requestDirection(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        requestDirection(1, 0);
      } else if (e.key === 'Escape') {
        setIsPaused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isPaused, requestDirection]);

  const handleStart = () => {
    const { grid, dots, spawnedCats } = createInitialBoard(tier);
    const eng = engineRef.current;
    eng.grid = grid;
    eng.dotsRemaining = dots;
    eng.mushak = {
      x: 9,
      y: 16,
      dir: { x: 0, y: 0 },
      nextDir: { x: -1, y: 0 },
      speed: tier.mushakSpeed,
      mouthAngle: 0.2,
      mouthSpeed: 12,
    };
    eng.cats = spawnedCats;
    eng.divineTimer = 0;
    eng.divineTotal = tier.divineDuration;
    eng.catCombo = 0;
    eng.particles = [];
    eng.popups = [];
    eng.fruit = null;
    eng.fruitTimer = 12;
    eng.lives = 3;
    eng.score = 0;
    eng.rawScore = 0;
    eng.stage = 1;
    eng.gameOver = false;
    eng.cleared = false;
    eng.resetPause = 0;
    eng.lastTime = performance.now();

    setRawScore(0);
    setScore(0);
    setTimeLeft(tier.timeLimit);
    setLives(3);
    setStage(1);
    setDivineTimeRemaining(0);
    setGameState('countdown');
  };

  const handleCountdownComplete = () => {
    const eng = engineRef.current;
    if (!eng.grid || eng.grid.length === 0) {
      const { grid, dots, spawnedCats } = createInitialBoard(tier);
      eng.grid = grid;
      eng.dotsRemaining = dots;
      eng.cats = spawnedCats;
    }
    eng.lastTime = performance.now();
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [gameState, isPaused, handleGameOver]);

  const isWall = (grid, col, row, isCat = false) => {
    if (!grid || !grid[row] || col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
    const cell = grid[row][col];
    if (cell === CELL.WALL) return true;
    if (cell === CELL.DOOR && !isCat) return true;
    return false;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (now) => {
      animId = requestAnimationFrame(loop);
      if (isPaused) {
        engineRef.current.lastTime = now;
        return;
      }

      const dt = Math.min((now - engineRef.current.lastTime) / 1000, 0.1);
      engineRef.current.lastTime = now;

      const eng = engineRef.current;
      if (eng.gameOver) return;

      // Make sure grid exists
      if (!eng.grid || !eng.grid.length) {
        const init = createInitialBoard(tier);
        eng.grid = init.grid;
        eng.dotsRemaining = init.dots;
        eng.cats = init.spawnedCats;
      }

      if (eng.resetPause > 0) {
        eng.resetPause -= dt;
        renderCanvas(ctx, eng);
        return;
      }

      if (eng.divineTimer > 0) {
        eng.divineTimer = Math.max(0, eng.divineTimer - dt);
        setDivineTimeRemaining(Math.ceil(eng.divineTimer));
        if (eng.divineTimer === 0) {
          eng.cats.forEach((c) => {
            if (c.state === 'SCARED') c.state = 'CHASE';
          });
        }
      }

      eng.fruitTimer -= dt;
      if (eng.fruitTimer <= 0 && !eng.fruit) {
        const offerings = [
          { name: 'Modak Thali', emoji: '🥮', points: 200, color: '#F59E0B' },
          { name: 'Sacred Coconut', emoji: '🥥', points: 300, color: '#10B981' },
          { name: 'Golden Mango', emoji: '🥭', points: 500, color: '#EAB308' },
        ];
        const pick = offerings[Math.floor(Math.random() * offerings.length)];
        eng.fruit = { x: 9, y: 12, ...pick, life: 10 };
        eng.fruitTimer = 22;
      }
      if (eng.fruit) {
        eng.fruit.life -= dt;
        if (eng.fruit.life <= 0) eng.fruit = null;
      }

      const m = eng.mushak;
      m.mouthAngle += m.mouthSpeed * dt;

      const atCenterX = Math.abs(m.x - Math.round(m.x)) < m.speed * dt * 0.85;
      const atCenterY = Math.abs(m.y - Math.round(m.y)) < m.speed * dt * 0.85;

      if ((atCenterX && m.nextDir.x === 0) || (atCenterY && m.nextDir.y === 0)) {
        const curCol = Math.round(m.x);
        const curRow = Math.round(m.y);
        const targetCol = curCol + m.nextDir.x;
        const targetRow = curRow + m.nextDir.y;

        if (!isWall(eng.grid, targetCol, targetRow, false)) {
          m.x = curCol;
          m.y = curRow;
          m.dir = { ...m.nextDir };
        }
      }

      if (m.dir.x !== 0 || m.dir.y !== 0) {
        const nextX = m.x + m.dir.x * m.speed * dt;
        const nextY = m.y + m.dir.y * m.speed * dt;

        if (Math.round(m.y) === 10) {
          if (nextX < -0.5) m.x = COLS - 0.5;
          else if (nextX > COLS - 0.5) m.x = -0.5;
          else m.x = nextX;
        } else {
          const nextCol = Math.round(nextX + m.dir.x * 0.45);
          const nextRow = Math.round(nextY + m.dir.y * 0.45);

          if (isWall(eng.grid, nextCol, nextRow, false)) {
            m.x = Math.round(m.x);
            m.y = Math.round(m.y);
            m.dir = { x: 0, y: 0 };
          } else {
            m.x = nextX;
            m.y = nextY;
          }
        }
      }

      const mCol = Math.round(m.x);
      const mRow = Math.round(m.y);
      if (eng.grid && eng.grid[mRow] && eng.grid[mRow][mCol] !== undefined) {
        const cell = eng.grid[mRow][mCol];
        if (cell === CELL.DOT) {
          eng.grid[mRow][mCol] = CELL.EMPTY;
          eng.dotsRemaining--;
          eng.rawScore += 10;
          playSound('munch');
        } else if (cell === CELL.POWER) {
          eng.grid[mRow][mCol] = CELL.EMPTY;
          eng.dotsRemaining--;
          eng.rawScore += 50;
          eng.divineTimer = eng.divineTotal;
          eng.catCombo = 0;
          eng.cats.forEach((c) => {
            if (c.state !== 'EATEN') c.state = 'SCARED';
          });
          playSound('divine');

          for (let p = 0; p < 12; p++) {
            eng.particles.push({
              x: mCol + 0.5,
              y: mRow + 0.5,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#FFD700',
              life: 0.6,
            });
          }
        }

        if (eng.fruit && Math.hypot(m.x - eng.fruit.x, m.y - eng.fruit.y) < 0.6) {
          eng.rawScore += eng.fruit.points;
          eng.popups.push({
            x: eng.fruit.x,
            y: eng.fruit.y,
            text: `+${eng.fruit.points}`,
            color: eng.fruit.color,
            life: 1.0,
          });
          playSound('fruit');
          eng.fruit = null;
        }

        if (eng.dotsRemaining <= 0 && !eng.cleared) {
          eng.cleared = true;
          playSound('clear');
          eng.rawScore += 500 + timeLeft * 10;
          setTimeout(() => {
            eng.stage++;
            setStage(eng.stage);
            const next = createInitialBoard(tier);
            eng.grid = next.grid;
            eng.dotsRemaining = next.dots;
            eng.cats = next.spawnedCats;
            eng.mushak.x = 9;
            eng.mushak.y = 16;
            eng.mushak.dir = { x: 0, y: 0 };
            eng.mushak.nextDir = { x: -1, y: 0 };
            eng.cleared = false;
          }, 1200);
        }
      }

      eng.score = Math.round(eng.rawScore * diffMultiplier);
      setRawScore(eng.rawScore);
      setScore(eng.score);

      eng.cats.forEach((cat) => {
        if (cat.state === 'HOUSE') {
          cat.houseTimer -= dt;
          cat.y = 10 + Math.sin(now * 0.005 + cat.id) * 0.25;
          if (cat.houseTimer <= 0) {
            cat.state = 'EXITING';
          }
          return;
        }

        if (cat.state === 'EXITING') {
          cat.x += (9 - cat.x) * 4 * dt;
          cat.y -= 2 * dt;
          if (cat.y <= 8.0) {
            cat.y = 8.0;
            cat.state = 'CHASE';
            cat.dir = { x: -1, y: 0 };
          }
          return;
        }

        if (cat.state === 'EATEN') {
          const dx = 9 - cat.x;
          const dy = 10 - cat.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.3) {
            cat.state = 'CHASE';
            cat.x = 9;
            cat.y = 8;
            cat.dir = { x: 0, y: -1 };
          } else {
            cat.x += (dx / dist) * 7.5 * dt;
            cat.y += (dy / dist) * 7.5 * dt;
          }
          return;
        }

        const curSpeed = cat.state === 'SCARED' ? cat.speed * 0.55 : cat.speed;
        const nextX = cat.x + cat.dir.x * curSpeed * dt;
        const nextY = cat.y + cat.dir.y * curSpeed * dt;

        if (Math.round(cat.y) === 10) {
          if (nextX < -0.5) cat.x = COLS - 0.5;
          else if (nextX > COLS - 0.5) cat.x = -0.5;
          else cat.x = nextX;
        } else {
          cat.x = nextX;
          cat.y = nextY;
        }

        const nearX = Math.abs(cat.x - Math.round(cat.x)) < curSpeed * dt * 0.9;
        const nearY = Math.abs(cat.y - Math.round(cat.y)) < curSpeed * dt * 0.9;

        if (nearX && nearY) {
          const col = Math.round(cat.x);
          const row = Math.round(cat.y);
          cat.x = col;
          cat.y = row;

          const possibleDirs = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
          ].filter((d) => {
            if (d.x === -cat.dir.x && d.y === -cat.dir.y) return false;
            return !isWall(eng.grid, col + d.x, row + d.y, true);
          });

          if (possibleDirs.length > 0) {
            if (cat.state === 'SCARED') {
              possibleDirs.sort((a, b) => {
                const distA = Math.hypot(col + a.x - m.x, row + a.y - m.y);
                const distB = Math.hypot(col + b.x - m.x, row + b.y - m.y);
                return distB - distA;
              });
              cat.dir = possibleDirs[0];
            } else {
              let target = { x: m.x, y: m.y };
              if (cat.name === 'Shyama') {
                target = { x: m.x + m.dir.x * 3, y: m.y + m.dir.y * 3 };
              } else if (cat.name === 'Pinku') {
                target = { x: m.x - m.dir.y * 2, y: m.y + m.dir.x * 2 };
              } else if (cat.name === 'Neelu') {
                const distToM = Math.hypot(col - m.x, row - m.y);
                target = distToM < 4 ? { x: 1, y: 1 } : { x: m.x, y: m.y };
              }

              possibleDirs.sort((a, b) => {
                const distA = Math.hypot(col + a.x - target.x, row + a.y - target.y);
                const distB = Math.hypot(col + b.x - target.x, row + b.y - target.y);
                return distA - distB;
              });
              cat.dir = possibleDirs[0];
            }
          } else {
            cat.dir = { x: -cat.dir.x, y: -cat.dir.y };
          }
        }

        const distToPlayer = Math.hypot(m.x - cat.x, m.y - cat.y);
        if (distToPlayer < 0.65) {
          if (cat.state === 'SCARED') {
            cat.state = 'EATEN';
            eng.catCombo++;
            const bonkPoints = 200 * Math.pow(2, Math.min(3, eng.catCombo - 1));
            eng.rawScore += bonkPoints;
            playSound('bonk');

            eng.popups.push({
              x: cat.x,
              y: cat.y,
              text: `+${bonkPoints}`,
              color: '#38BDF8',
              life: 1.2,
            });

            for (let p = 0; p < 15; p++) {
              eng.particles.push({
                x: cat.x + 0.5,
                y: cat.y + 0.5,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#38BDF8',
                life: 0.7,
              });
            }
          } else if (cat.state === 'CHASE') {
            playSound('hit');
            eng.lives--;
            setLives(eng.lives);

            if (eng.lives <= 0) {
              handleGameOver();
            } else {
              eng.resetPause = 1.0;
              eng.mushak.x = 9;
              eng.mushak.y = 16;
              eng.mushak.dir = { x: 0, y: 0 };
              eng.mushak.nextDir = { x: -1, y: 0 };
              eng.cats.forEach((c, idx) => {
                const def = CAT_COLORS[idx % CAT_COLORS.length];
                c.x = def.homeX;
                c.y = def.homeY;
                c.state = idx === 0 ? 'CHASE' : 'HOUSE';
                c.dir = { x: 0, y: -1 };
                c.houseTimer = idx * 2.5;
              });
            }
          }
        }
      });

      eng.particles = eng.particles.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        return p.life > 0;
      });

      eng.popups = eng.popups.filter((pop) => {
        pop.y -= 1.2 * dt;
        pop.life -= dt;
        return pop.life > 0;
      });

      renderCanvas(ctx, eng);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, isPaused, diffMultiplier, handleGameOver, playSound, tier]);

  const renderCanvas = (ctx, eng) => {
    if (!eng.grid || !eng.grid.length) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const cellSize = width / COLS;

    ctx.fillStyle = '#0B081A';
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < ROWS; r++) {
      if (!eng.grid[r]) continue;
      for (let c = 0; c < COLS; c++) {
        const cell = eng.grid[r][c];
        const x = c * cellSize;
        const y = r * cellSize;

        if (cell === CELL.WALL) {
          ctx.fillStyle = '#22143B';
          ctx.fillRect(x, y, cellSize, cellSize);

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        } else if (cell === CELL.DOOR) {
          ctx.fillStyle = '#EC4899';
          ctx.fillRect(x, y + cellSize * 0.4, cellSize, cellSize * 0.2);
        } else if (cell === CELL.DOT) {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.16, 0, Math.PI * 2);
          ctx.fillStyle = '#FBBF24';
          ctx.fill();
        } else if (cell === CELL.POWER) {
          const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.2;
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.35 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = '#FFD700';
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    if (eng.fruit) {
      const fx = eng.fruit.x * cellSize + cellSize / 2;
      const fy = eng.fruit.y * cellSize + cellSize / 2;
      ctx.font = `${cellSize * 1.1}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(eng.fruit.emoji, fx, fy);
    }

    const mx = eng.mushak.x * cellSize + cellSize / 2;
    const my = eng.mushak.y * cellSize + cellSize / 2;
    const mRadius = cellSize * 0.44;

    ctx.save();
    ctx.translate(mx, my);

    if (eng.divineTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, mRadius * 1.6 + Math.sin(performance.now() * 0.01) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    let rot = 0;
    if (eng.mushak.dir.x === 1) rot = 0;
    else if (eng.mushak.dir.x === -1) rot = Math.PI;
    else if (eng.mushak.dir.y === 1) rot = Math.PI / 2;
    else if (eng.mushak.dir.y === -1) rot = -Math.PI / 2;
    ctx.rotate(rot);

    const chomp = Math.abs(Math.sin(eng.mushak.mouthAngle)) * 0.45;

    ctx.beginPath();
    ctx.arc(0, 0, mRadius, chomp, Math.PI * 2 - chomp);
    ctx.lineTo(0, 0);
    ctx.fillStyle = eng.divineTimer > 0 ? '#FFD700' : '#E2E8F0';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-mRadius * 0.4, -mRadius * 0.8, mRadius * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = eng.divineTimer > 0 ? '#F59E0B' : '#F472B6';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mRadius * 0.2, -mRadius * 0.4, mRadius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    ctx.restore();

    eng.cats.forEach((cat) => {
      const cx = cat.x * cellSize + cellSize / 2;
      const cy = cat.y * cellSize + cellSize / 2;
      const cRadius = cellSize * 0.44;

      ctx.save();
      ctx.translate(cx, cy);

      if (cat.state === 'EATEN') {
        ctx.beginPath();
        ctx.arc(-cRadius * 0.3, -cRadius * 0.1, cRadius * 0.25, 0, Math.PI * 2);
        ctx.arc(cRadius * 0.3, -cRadius * 0.1, cRadius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-cRadius * 0.3, -cRadius * 0.1, cRadius * 0.12, 0, Math.PI * 2);
        ctx.arc(cRadius * 0.3, -cRadius * 0.1, cRadius * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#0284C7';
        ctx.fill();
      } else {
        const isScared = cat.state === 'SCARED';
        const isBlinking = isScared && eng.divineTimer < 2.2 && Math.floor(performance.now() * 0.007) % 2 === 0;
        const bodyColor = isScared ? (isBlinking ? '#FFFFFF' : '#38BDF8') : cat.color;

        ctx.beginPath();
        ctx.arc(0, -cRadius * 0.15, cRadius * 0.85, Math.PI, 0);
        ctx.lineTo(cRadius * 0.85, cRadius * 0.8);
        ctx.lineTo(cRadius * 0.45, cRadius * 0.55);
        ctx.lineTo(0, cRadius * 0.8);
        ctx.lineTo(-cRadius * 0.45, cRadius * 0.55);
        ctx.lineTo(-cRadius * 0.85, cRadius * 0.8);
        ctx.closePath();
        ctx.fillStyle = bodyColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-cRadius * 0.7, -cRadius * 0.5);
        ctx.lineTo(-cRadius * 0.85, -cRadius * 1.15);
        ctx.lineTo(-cRadius * 0.25, -cRadius * 0.85);
        ctx.closePath();
        ctx.fillStyle = bodyColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cRadius * 0.7, -cRadius * 0.5);
        ctx.lineTo(cRadius * 0.85, -cRadius * 1.15);
        ctx.lineTo(cRadius * 0.25, -cRadius * 0.85);
        ctx.closePath();
        ctx.fillStyle = bodyColor;
        ctx.fill();

        if (isScared) {
          ctx.beginPath();
          ctx.arc(-cRadius * 0.3, -cRadius * 0.1, cRadius * 0.18, 0, Math.PI * 2);
          ctx.arc(cRadius * 0.3, -cRadius * 0.1, cRadius * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = isBlinking ? '#EF4444' : '#FFFFFF';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(-cRadius * 0.3, -cRadius * 0.15, cRadius * 0.22, 0, Math.PI * 2);
          ctx.arc(cRadius * 0.3, -cRadius * 0.15, cRadius * 0.22, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-cRadius * 0.3 + cat.dir.x * 2, -cRadius * 0.15 + cat.dir.y * 2, cRadius * 0.12, 0, Math.PI * 2);
          ctx.arc(cRadius * 0.3 + cat.dir.x * 2, -cRadius * 0.15 + cat.dir.y * 2, cRadius * 0.12, 0, Math.PI * 2);
          ctx.fillStyle = '#0F172A';
          ctx.fill();
        }
      }

      ctx.restore();
    });

    eng.particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * cellSize, p.y * cellSize, cellSize * 0.15 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    eng.popups.forEach((pop) => {
      ctx.save();
      ctx.font = `bold ${cellSize * 0.85}px sans-serif`;
      ctx.fillStyle = pop.color;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, pop.life);
      ctx.fillText(pop.text, pop.x * cellSize, pop.y * cellSize);
      ctx.restore();
    });
  };

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
          mazes: stage,
          multiplier: DIFFICULTY_TIERS[difficulty]?.multiplierLabel,
        }}
        stats={{
          stageReached: stage,
          livesRemaining: lives,
          score,
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
              maxWidth: 440,
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
            <div style={{ fontSize: '3.4rem', filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.5))' }}>
              🐭
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #F59E0B, #10B981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}
              >
                MUSHAK MODAK CHASE
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
                Gobble sacred Prasad Modaks, dodge the Palace Cats, and grab Golden Maha-Laddus to turn into Super Divine Mushak and bonk the cats!
              </p>
            </div>

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
              PLAY NOW ({DIFFICULTY_TIERS[difficulty]?.name.toUpperCase()})
            </button>
          </motion.div>
        )}

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
              maxWidth: '420px',
              gap: '0.6rem',
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
                padding: '0.55rem 0.75rem',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F59E0B' }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STAGE</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10B981' }}>{stage}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LIVES</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#EF4444' }}>
                  {'❤️'.repeat(Math.max(0, lives))}
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

            {/* Super Divine Mode Banner */}
            {divineTimeRemaining > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #F59E0B, #EAB308, #F59E0B)',
                  color: '#0F172A',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 0 15px rgba(245,158,11,0.6)',
                }}
              >
                <Sparkles size={16} /> SUPER DIVINE MUSHAK! BONK CATS: {divineTimeRemaining}s
              </motion.div>
            )}

            {/* 60 FPS HTML5 Arcade Canvas */}
            <div
              style={{
                width: '100%',
                maxWidth: '390px',
                aspectRatio: `${COLS} / ${ROWS}`,
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(245,158,11,0.3)',
                boxShadow: '0 0 30px rgba(0,0,0,0.8)',
                background: '#0B081A',
                touchAction: 'none',
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <canvas
                ref={canvasRef}
                width={380}
                height={420}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>

            {/* Virtual Responsive Arcade D-Pad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 58px)',
                gridTemplateRows: 'repeat(3, 46px)',
                gap: '4px',
                marginTop: '0.2rem',
                justifyContent: 'center',
              }}
            >
              <div />
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  requestDirection(0, -1);
                }}
                style={dpadBtnStyle}
                aria-label="Up"
              >
                <ArrowUp size={22} />
              </button>
              <div />

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  requestDirection(-1, 0);
                }}
                style={dpadBtnStyle}
                aria-label="Left"
              >
                <ArrowLeft size={22} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>SWIPE / D-PAD</span>
              </div>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  requestDirection(1, 0);
                }}
                style={dpadBtnStyle}
                aria-label="Right"
              >
                <ArrowRight size={22} />
              </button>

              <div />
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  requestDirection(0, 1);
                }}
                style={dpadBtnStyle}
                aria-label="Down"
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
