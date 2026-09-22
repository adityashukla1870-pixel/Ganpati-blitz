import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Circle, Sparkles, Flame, AlertTriangle, Zap, Skull, HelpCircle, Star, Pause } from 'lucide-react'
import Countdown from '../components/Countdown'
import ScoreDisplay from '../components/ScoreDisplay'
import Timer from '../components/Timer'
import ComboDisplay from '../components/ComboDisplay'
import DifficultySelector from '../components/DifficultySelector'
import PauseOverlay from '../components/PauseOverlay'
import { getSoundEnabled, setSoundEnabled, getPlayer } from '../utils/storage'
import { createGuestPlayerIfMissing } from '../utils/useServerHealth'
import { getSelectedDifficulty, setSelectedDifficulty, recordGameResult } from '../utils/progression'
import { DIFFICULTY_TIERS } from '../config/difficulties'
import { triggerHaptic, playJuicyAudio } from '../utils/haptics'

const GAME_DURATION = 30

// 7 Modak / Hazard types
const OBJ_TYPES = {
  classic: {
    icon: Circle,
    label: '+10',
    color: '#FF6B35',
    bgColor: 'rgba(255, 107, 53, 0.25)',
    border: '2px solid rgba(255, 107, 53, 0.6)',
    points: 10,
    iconColor: '#FF6B35',
    glow: '0 0 14px rgba(255, 107, 53, 0.4)',
  },
  golden: {
    icon: Sparkles,
    label: '+30',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.3)',
    border: '2px solid rgba(255, 215, 0, 0.8)',
    points: 30,
    iconColor: '#FFD700',
    glow: '0 0 24px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.25)',
  },
  silver: {
    icon: Zap,
    label: '+20 Fast',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.25)',
    border: '2px solid rgba(56, 189, 248, 0.7)',
    points: 20,
    iconColor: '#38BDF8',
    glow: '0 0 18px rgba(56, 189, 248, 0.5)',
    speedMult: 1.5,
  },
  kesar: {
    icon: Star,
    label: 'Frenzy +40',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.35)',
    border: '2px solid #F59E0B',
    points: 40,
    iconColor: '#F59E0B',
    glow: '0 0 28px rgba(245, 158, 11, 0.8)',
    isFrenzyTrigger: true,
  },
  decoy: {
    icon: Circle,
    label: 'Decoy -20',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.25)',
    border: '2px dashed rgba(168, 85, 247, 0.7)',
    points: -20,
    iconColor: '#C084FC',
    glow: '0 0 16px rgba(168, 85, 247, 0.5)',
    isDecoy: true,
  },
  burnt: {
    icon: Flame,
    label: '-15',
    color: '#FF6347',
    bgColor: 'rgba(255, 99, 71, 0.25)',
    border: '2px solid rgba(255, 99, 71, 0.6)',
    points: -15,
    iconColor: '#FF6347',
    glow: '0 0 14px rgba(255, 99, 71, 0.4)',
  },
  danger: {
    icon: Skull,
    label: '-35',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.35)',
    border: '2px solid rgba(239, 68, 68, 0.8)',
    points: -35,
    iconColor: '#EF4444',
    glow: '0 0 20px rgba(239, 68, 68, 0.6)',
  },
}

// Tier-specific gameplay physics and object distributions
const TIER_PARAMS = {
  easy: {
    baseSpeed: 1.25,
    size: 58,
    spawnIntervalBase: 1100,
    spawnIntervalMin: 550,
    driftType: 'none',
    clusterRate: 0.1,
    types: [
      { type: 'classic', weight: 0.75 },
      { type: 'golden', weight: 0.20 },
      { type: 'burnt', weight: 0.05 },
    ],
  },
  normal: {
    baseSpeed: 1.7,
    size: 52,
    spawnIntervalBase: 950,
    spawnIntervalMin: 420,
    driftType: 'none',
    clusterRate: 0.2,
    types: [
      { type: 'classic', weight: 0.55 },
      { type: 'golden', weight: 0.18 },
      { type: 'silver', weight: 0.12 },
      { type: 'burnt', weight: 0.10 },
      { type: 'danger', weight: 0.05 },
    ],
  },
  hard: {
    baseSpeed: 2.15,
    size: 48,
    spawnIntervalBase: 800,
    spawnIntervalMin: 320,
    driftType: 'sine',
    driftAmp: 10,
    clusterRate: 0.35,
    types: [
      { type: 'classic', weight: 0.40 },
      { type: 'golden', weight: 0.14 },
      { type: 'silver', weight: 0.14 },
      { type: 'kesar', weight: 0.08 },
      { type: 'decoy', weight: 0.10 },
      { type: 'burnt', weight: 0.08 },
      { type: 'danger', weight: 0.06 },
    ],
  },
  expert: {
    baseSpeed: 2.55,
    size: 46,
    spawnIntervalBase: 680,
    spawnIntervalMin: 250,
    driftType: 'crosswind',
    clusterRate: 0.5,
    types: [
      { type: 'classic', weight: 0.32 },
      { type: 'golden', weight: 0.14 },
      { type: 'silver', weight: 0.16 },
      { type: 'kesar', weight: 0.08 },
      { type: 'decoy', weight: 0.13 },
      { type: 'burnt', weight: 0.09 },
      { type: 'danger', weight: 0.08 },
    ],
  },
  master: {
    baseSpeed: 2.95,
    size: 44,
    spawnIntervalBase: 520,
    spawnIntervalMin: 200,
    driftType: 'zigzag',
    clusterRate: 0.7,
    types: [
      { type: 'classic', weight: 0.26 },
      { type: 'golden', weight: 0.14 },
      { type: 'silver', weight: 0.18 },
      { type: 'kesar', weight: 0.08 },
      { type: 'decoy', weight: 0.16 },
      { type: 'burnt', weight: 0.09 },
      { type: 'danger', weight: 0.09 },
    ],
  },
}

function pickTypeForTier(tierConfig) {
  const pool = tierConfig.types
  const roll = Math.random()
  let cumulative = 0
  for (const item of pool) {
    cumulative += item.weight
    if (roll <= cumulative) return item.type
  }
  return 'classic'
}

function getComboMultiplier(combo) {
  if (combo >= 10) return 2.5 // + Ganpati Blessing
  if (combo >= 6) return 2.0
  if (combo >= 3) return 1.5
  return 1.0
}

let objIdCounter = 0

export default function ModakRush({ player: propsPlayer }) {
  const player = useMemo(() => {
    return propsPlayer || getPlayer() || createGuestPlayerIfMissing()
  }, [propsPlayer])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [difficulty, setDifficulty] = useState(() => {
    const diffParam = searchParams.get('diff')
    return diffParam && TIER_PARAMS[diffParam] ? diffParam : getSelectedDifficulty('modak-rush')
  })

  const [gameState, setGameState] = useState(() => {
    return searchParams.get('autostart') === '1' ? 'countdown' : 'idle'
  })
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  isPausedRef.current = isPaused
  const [score, setScore] = useState(0)
  const [rawScore, setRawScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION)
  const [frenzyTimer, setFrenzyTimer] = useState(0)
  const [screenShake, setScreenShake] = useState(false)
  const [objects, setObjects] = useState([])
  const [popups, setPopups] = useState([])
  const [particles, setParticles] = useState([])
  const [stats, setStats] = useState({
    modaksCollected: 0,
    goldenCollected: 0,
    frenzyModaks: 0,
    burntCollected: 0,
    dangerHit: 0,
  })
  const [isSoundEnabled, setIsSoundEnabled] = useState(getSoundEnabled)

  const gameAreaRef = useRef(null)
  const animFrameRef = useRef(null)
  const spawnIntervalRef = useRef(null)
  const timerRef = useRef(null)
  const frenzyIntervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const objectsRef = useRef([])
  const scoreRef = useRef(0)
  const rawScoreRef = useRef(0)
  const comboRef = useRef(0)
  const frenzyRef = useRef(0)
  const statsRef = useRef({ modaksCollected: 0, goldenCollected: 0, frenzyModaks: 0, burntCollected: 0, dangerHit: 0 })

  const tier = TIER_PARAMS[difficulty] || TIER_PARAMS.normal
  const diffMultiplier = DIFFICULTY_TIERS[difficulty]?.multiplier || 1.5

  const spawnParticles = useCallback((x, y, type) => {
    const isGolden = type === 'golden' || type === 'kesar'
    const isDanger = type === 'danger' || type === 'decoy'
    const count = isGolden ? 7 : isDanger ? 5 : 4

    const emojis = isGolden
      ? ['✨', '⭐', '🥟', '🪷']
      : isDanger
        ? ['💥', '🔥', '💀']
        : ['✨', '🥟', '🪷']

    const newParticles = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.4
      const dist = (isGolden ? 45 : 32) + Math.random() * 22
      newParticles.push({
        id: Math.random() + Date.now(),
        x,
        y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: isGolden ? 20 : 15,
      })
    }

    setParticles((prev) => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)))
    }, 650)
  }, [])

  useEffect(() => {
    setSoundEnabled(isSoundEnabled)
  }, [isSoundEnabled])

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && gameState === 'playing') {
        setIsPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameState])

  const handleDifficultySelect = (newDiff) => {
    setDifficulty(newDiff)
    setSelectedDifficulty('modak-rush', newDiff)
  }

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    if (frenzyIntervalRef.current) clearInterval(frenzyIntervalRef.current)
    objectsRef.current = []
    setObjects([])
    setPopups([])
    setParticles([])
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const spawnObject = useCallback(() => {
    const area = gameAreaRef.current
    if (!area) return
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const progress = elapsed / GAME_DURATION
    const speedInc = progress * 0.4
    const type = pickTypeForTier(tier)
    const typeInfo = OBJ_TYPES[type]
    const speedMult = typeInfo.speedMult || 1.0

    const obj = {
      id: ++objIdCounter,
      type,
      x: 10 + Math.random() * 80,
      baseX: 10 + Math.random() * 80,
      y: -10,
      speed: (tier.baseSpeed + speedInc) * speedMult,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 4,
      driftPhase: Math.random() * Math.PI * 2,
      driftDir: Math.random() > 0.5 ? 1 : -1,
      createdAt: Date.now(),
    }
    objectsRef.current = [...objectsRef.current, obj]
    setObjects([...objectsRef.current])
  }, [tier])

  const startGameLoop = useCallback(() => {
    const loop = () => {
      const now = Date.now()
      const elapsed = (now - startTimeRef.current) / 1000

      objectsRef.current = objectsRef.current
        .map((obj) => {
          let newX = obj.x
          const driftAge = (now - obj.createdAt) / 1000

          if (tier.driftType === 'sine') {
            newX = Math.max(5, Math.min(95, obj.baseX + Math.sin(driftAge * 3 + obj.driftPhase) * (tier.driftAmp || 10)))
          } else if (tier.driftType === 'crosswind') {
            newX = Math.max(5, Math.min(95, obj.baseX + obj.driftDir * driftAge * 14))
          } else if (tier.driftType === 'zigzag') {
            const zig = (Math.sin(driftAge * 5) > 0 ? 1 : -1) * 8
            newX = Math.max(5, Math.min(95, obj.baseX + zig))
          }

          return {
            ...obj,
            x: newX,
            y: obj.y + obj.speed,
            rotation: obj.rotation + obj.rotSpeed,
          }
        })
        .filter((obj) => obj.y < 112)

      setObjects([...objectsRef.current])
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
  }, [tier])

  const startSpawning = useCallback(() => {
    const spawn = () => {
      if (!startTimeRef.current) return
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const progress = Math.min(1, elapsed / GAME_DURATION)
      const interval = Math.max(
        tier.spawnIntervalMin,
        tier.spawnIntervalBase - progress * (tier.spawnIntervalBase - tier.spawnIntervalMin)
      )

      spawnObject()

      // Simultaneous cluster drops for higher tiers
      if (Math.random() < tier.clusterRate + progress * 0.2) {
        setTimeout(spawnObject, 120 + Math.random() * 160)
      }

      spawnIntervalRef.current = setTimeout(spawn, interval)
    }
    spawn()
  }, [spawnObject, tier])

  const handleCountdownComplete = useCallback(() => {
    setGameState('playing')
    startTimeRef.current = Date.now()
    scoreRef.current = 0
    rawScoreRef.current = 0
    comboRef.current = 0
    frenzyRef.current = 0
    statsRef.current = { modaksCollected: 0, goldenCollected: 0, frenzyModaks: 0, burntCollected: 0, dangerHit: 0 }
    setScore(0)
    setRawScore(0)
    setCombo(0)
    setMaxCombo(0)
    setFrenzyTimer(0)
    setStats({ ...statsRef.current })

    startSpawning()
    startGameLoop()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, GAME_DURATION - elapsed)
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setGameState('gameover')
      }
    }, 50)
  }, [startSpawning, startGameLoop])

  const triggerFrenzy = useCallback(() => {
    frenzyRef.current = 4 // 4 seconds of Modak Frenzy
    setFrenzyTimer(4)
    if (frenzyIntervalRef.current) clearInterval(frenzyIntervalRef.current)

    frenzyIntervalRef.current = setInterval(() => {
      frenzyRef.current = Math.max(0, frenzyRef.current - 0.1)
      setFrenzyTimer(Math.ceil(frenzyRef.current))
      if (frenzyRef.current <= 0) {
        clearInterval(frenzyIntervalRef.current)
      }
    }, 100)
  }, [])

  const handleCollect = useCallback(
    (objId) => {
      const objIndex = objectsRef.current.findIndex((o) => o.id === objId)
      if (objIndex === -1) return

      const obj = objectsRef.current[objIndex]
      const typeInfo = OBJ_TYPES[obj.type]

      objectsRef.current.splice(objIndex, 1)
      setObjects([...objectsRef.current])

      let points = 0
      let newCombo = comboRef.current
      const newStats = { ...statsRef.current }
      const isFrenzy = frenzyRef.current > 0

      if (obj.type === 'classic') {
        newCombo++
        const mult = getComboMultiplier(newCombo) * (isFrenzy ? 2 : 1)
        points = Math.round(typeInfo.points * mult)
        newStats.modaksCollected++
        if (isFrenzy) newStats.frenzyModaks++
        triggerHaptic('light')
        playJuicyAudio(newCombo, 'classic', isSoundEnabled)
        spawnParticles(obj.x, obj.y, 'classic')
      } else if (obj.type === 'golden') {
        newCombo++
        const mult = getComboMultiplier(newCombo) * (isFrenzy ? 2 : 1)
        points = Math.round(typeInfo.points * mult)
        newStats.modaksCollected++
        newStats.goldenCollected++
        triggerHaptic('success')
        playJuicyAudio(newCombo, 'golden', isSoundEnabled)
        spawnParticles(obj.x, obj.y, 'golden')
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 200)
      } else if (obj.type === 'silver') {
        newCombo++
        const mult = getComboMultiplier(newCombo) * (isFrenzy ? 2 : 1)
        points = Math.round(typeInfo.points * mult)
        newStats.modaksCollected++
        triggerHaptic('medium')
        playJuicyAudio(newCombo, 'silver', isSoundEnabled)
        spawnParticles(obj.x, obj.y, 'silver')
      } else if (obj.type === 'kesar') {
        newCombo++
        const mult = getComboMultiplier(newCombo)
        points = Math.round(typeInfo.points * mult)
        newStats.modaksCollected++
        triggerFrenzy()
        triggerHaptic('success')
        playJuicyAudio(newCombo, 'kesar', isSoundEnabled)
        spawnParticles(obj.x, obj.y, 'kesar')
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 250)
      } else if (obj.type === 'decoy') {
        points = typeInfo.points
        newCombo = 0
        triggerHaptic('warning')
        playJuicyAudio(0, 'decoy', isSoundEnabled)
        spawnParticles(obj.x, obj.y, 'decoy')
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 300)
      } else if (obj.type === 'burnt') {
        points = typeInfo.points
        newCombo = 0
        newStats.burntCollected++
        triggerHaptic('warning')
        playJuicyAudio(0, 'burnt', isSoundEnabled)
        spawnParticles(obj.x, obj.y, 'burnt')
      } else if (obj.type === 'danger') {
        points = typeInfo.points
        newCombo = 0
        newStats.dangerHit++
        triggerHaptic('danger')
        playJuicyAudio(0, 'danger', isSoundEnabled)
        spawnParticles(obj.x, obj.y, 'danger')
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 400)
      }

      // 10x Combo Super Burst
      if (newCombo === 10) {
        triggerHaptic('success')
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 350)
      }

      comboRef.current = newCombo
      statsRef.current = newStats
      rawScoreRef.current = Math.max(0, rawScoreRef.current + points)
      const calculatedTotal = Math.round(rawScoreRef.current * diffMultiplier)
      scoreRef.current = calculatedTotal

      setCombo(newCombo)
      setRawScore(rawScoreRef.current)
      setScore(calculatedTotal)
      setStats({ ...newStats })
      if (newCombo > maxCombo) setMaxCombo(newCombo)

      const color =
        points > 0 ? (obj.type === 'golden' ? '#FFD700' : obj.type === 'kesar' ? '#F59E0B' : '#4ADE80') : '#EF4444'

      let popupText = points > 0 ? `+${points}` : `${points}`
      if (obj.type === 'golden') popupText = `⭐ +${points} GOLDEN!`
      else if (obj.type === 'kesar') popupText = `🔥 FRENZY 2X!`
      else if (newCombo >= 10 && points > 0) popupText = `✨ +${points} BLESSING!`
      else if (newCombo >= 5 && points > 0) popupText = `⚡ +${points} (${newCombo}x)`
      else if (obj.type === 'danger') popupText = `💀 ${points} DANGER!`
      else if (obj.type === 'decoy') popupText = `❌ ${points} DECOY!`

      const popupId = Date.now() + Math.random()
      setPopups((prev) => [
        ...prev,
        {
          id: popupId,
          x: obj.x,
          y: obj.y,
          text: popupText,
          color,
          isSpecial: obj.type === 'golden' || obj.type === 'kesar' || newCombo >= 5,
        },
      ])

      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== popupId))
      }, 850)
    },
    [diffMultiplier, isSoundEnabled, maxCombo, spawnParticles, triggerFrenzy]
  )

  const handleStart = useCallback(() => {
    setGameState('countdown')
  }, [])

  const handleGameOver = useCallback(() => {
    cleanup()
    const finalScore = scoreRef.current
    const progressionResult = recordGameResult('modak-rush', difficulty, finalScore)

    navigate('/game/modak-rush/result', {
      state: {
        gameId: 'modak-rush',
        score: finalScore,
        difficulty,
        isPersonalBest: progressionResult.isTierPB || progressionResult.isGlobalPB,
        previousBest: progressionResult.prevTierBest,
        newlyUnlockedTier: progressionResult.newlyUnlockedTier,
        scoreBreakdown: {
          base: rawScoreRef.current,
          maxCombo: Math.max(maxCombo, comboRef.current),
          multiplier: DIFFICULTY_TIERS[difficulty]?.multiplierLabel,
        },
        stats: statsRef.current,
        duration: GAME_DURATION,
      },
    })
  }, [cleanup, difficulty, maxCombo, navigate])

  useEffect(() => {
    if (gameState === 'gameover') {
      handleGameOver()
    }
  }, [gameState, handleGameOver])

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 88px)',
        overflow: 'hidden',
        animation: screenShake ? 'shake 0.3s ease-in-out' : undefined,
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(-4px, 3px) scale(1.01); }
          40% { transform: translate(4px, -3px) scale(1.008); }
          60% { transform: translate(-3px, 2px) scale(1); }
          80% { transform: translate(2px, -1px) scale(1); }
        }
      `}</style>
      {/* Frenzy Banner */}
      <AnimatePresence>
        {frenzyTimer > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '4.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              padding: '0.4rem 1.2rem',
              background: 'linear-gradient(90deg, #F59E0B, #FFD700)',
              color: '#000',
              fontWeight: 900,
              borderRadius: '9999px',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
            }}
          >
            <Flame size={18} /> MODAK FRENZY (2x POINTS)! {frenzyTimer}s
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      {gameState === 'playing' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-hud"
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            right: '0.75rem',
            zIndex: 10,
          }}
        >
          <ScoreDisplay score={score} />
          <Timer timeRemaining={timeRemaining} totalTime={GAME_DURATION} isRunning={gameState === 'playing'} />
          <ComboDisplay combo={combo} isActive={gameState === 'playing'} />
        </motion.div>
      )}

      {/* Pause Button */}
      {gameState === 'playing' && (
        <button
          onClick={() => setIsPaused(true)}
          style={{
            position: 'absolute',
            top: '4.25rem',
            right: '3.75rem',
            zIndex: 20,
            background: 'rgba(15, 15, 35, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-full)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFD166',
            transition: 'all 0.2s ease',
          }}
          title="Pause Game (Esc)"
          aria-label="Pause"
        >
          <Pause size={18} />
        </button>
      )}

      {/* Sound toggle */}
      <button
        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
        style={{
          position: 'absolute',
          top: gameState === 'playing' ? '4.25rem' : '1rem',
          right: '1rem',
          zIndex: 20,
          background: 'rgba(15, 15, 35, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-full)',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isSoundEnabled ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'all 0.2s ease',
        }}
      >
        {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <PauseOverlay
            gameId="modak-rush"
            onResume={() => setIsPaused(false)}
            onRestart={() => {
              setIsPaused(false)
              handleStart()
            }}
            onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
            soundEnabled={isSoundEnabled}
            onQuit={() => navigate('/games')}
          />
        )}
      </AnimatePresence>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: frenzyTimer > 0
            ? 'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(245, 158, 11, 0.3), transparent 70%), linear-gradient(180deg, #2A1305 0%, #150820 100%)'
            : 'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(255,153,51,0.12), transparent 60%), linear-gradient(180deg, #140a2e 0%, var(--festival-maroon) 100%)',
          transition: 'background 0.5s ease',
          overflow: 'hidden',
        }}
      >
        {/* Game objects */}
        <AnimatePresence>
          {objects.map((obj) => {
            const info = OBJ_TYPES[obj.type] || OBJ_TYPES.classic
            const objSize = tier.size || 52

            return (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.12 }}
                onClick={() => handleCollect(obj.id)}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  handleCollect(obj.id)
                }}
                style={{
                  position: 'absolute',
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  width: `${objSize}px`,
                  height: `${objSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: info.bgColor,
                  border: info.border,
                  borderRadius: obj.type === 'danger' ? '12px' : '50%',
                  boxShadow: info.glow,
                  transform: `translateX(-50%) rotate(${obj.rotation}deg)`,
                  zIndex: 5,
                }}
              >
                <info.icon size={objSize * 0.48} style={{ color: info.iconColor }} />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Burst Particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.8, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1.4, x: p.dx, y: p.dy }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${p.size}px`,
                pointerEvents: 'none',
                zIndex: 45,
                filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.7))',
              }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Juicy Score popups */}
        <AnimatePresence>
          {popups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -65, scale: popup.isSpecial ? 1.4 : 1.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: `${popup.x}%`,
                top: `${popup.y}%`,
                transform: 'translateX(-50%)',
                fontSize: popup.isSpecial ? '1.45rem' : '1.25rem',
                fontWeight: 900,
                color: popup.color,
                pointerEvents: 'none',
                textShadow: popup.isSpecial
                  ? '0 0 14px rgba(255,215,0,0.8), 0 2px 8px rgba(0,0,0,0.9)'
                  : '0 2px 8px rgba(0,0,0,0.85)',
                zIndex: 50,
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
              }}
            >
              {popup.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Idle / Start screen */}
        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              background: 'rgba(11, 12, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              zIndex: 10,
              padding: '1.5rem',
              overflowY: 'auto',
            }}
          >
            <div
              className="card card-ornate"
              style={{
                textAlign: 'center',
                maxWidth: 420,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.5rem',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 16px rgba(255,153,51,0.5))' }}
              >
                <Circle size={44} color="#FF6B35" />
              </motion.div>
              <div>
                <h2 style={{ fontSize: '1.7rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>
                  MODAK RUSH
                </h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0', fontSize: '0.88rem' }}>
                  Collect modaks, trigger Kesar frenzy, avoid hazards, and master the blitz!
                </p>
              </div>

              {/* Difficulty Selector in Pre-Game */}
              <div style={{ width: '100%' }}>
                <DifficultySelector
                  gameId="modak-rush"
                  selectedTier={difficulty}
                  onChange={handleDifficultySelect}
                  compact={true}
                  showDescription={true}
                />
              </div>

              <button
                className="btn btn-play"
                onClick={handleStart}
                style={{
                  fontSize: '1.1rem',
                  padding: '0.85rem 2.2rem',
                  width: '100%',
                  marginTop: '0.25rem',
                }}
              >
                START ({DIFFICULTY_TIERS[difficulty]?.name.toUpperCase()})
              </button>

              {/* Item Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', width: '100%' }}>
                {[
                  { icon: Circle, color: '#FF6B35', label: 'Classic +10' },
                  { icon: Sparkles, color: '#FFD700', label: 'Gold +30' },
                  { icon: Zap, color: '#38BDF8', label: 'Silver +20' },
                  { icon: Star, color: '#F59E0B', label: 'Kesar 2x' },
                  { icon: Circle, color: '#A855F7', label: 'Decoy -20' },
                  { icon: Flame, color: '#FF6347', label: 'Burnt -15' },
                  { icon: Skull, color: '#EF4444', label: 'Skull -35' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '0.4rem 0.2rem',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <item.icon size={18} style={{ color: item.color }} />
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {gameState === 'countdown' && <Countdown onComplete={handleCountdownComplete} />}
      </AnimatePresence>
    </div>
  )
}
