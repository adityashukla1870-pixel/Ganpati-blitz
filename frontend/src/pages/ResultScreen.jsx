import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Trophy, RotateCcw, Home, Star, TrendingUp, TrendingDown, Gamepad2, Flag, Award, Sparkles, ArrowRight, Crown, Zap, Flame, Target } from 'lucide-react'
import { DIFFICULTY_TIERS } from '../config/difficulties'
import { estimateUniversalPoints } from '../config/universalPoints'
import { submitScore } from '../services/api'
import { getPlayer, setUniversalPoints } from '../utils/storage'
import { getNearMissInfo, getNextRivalTarget } from '../utils/rivalry'
import { triggerHaptic } from '../utils/haptics'
import PlayerAvatar from '../components/PlayerAvatar'
import { AVATAR_LIST, getAvatarMeta } from '../config/avatars'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

const GAME_META = {
  'modak-rush': { icon: 'modak-rush', name: 'Modak Rush' },
  'diya-dash': { icon: 'diya-dash', name: 'Diya Dash' },
  'dhol-battle': { icon: 'dhol-battle', name: 'Dhol Battle' },
  'rangoli-rush': { icon: 'rangoli-rush', name: 'Rangoli Rush' },
  'mushak-maze': { icon: 'mushak-maze', name: 'Mushak Maze' },
  'ganpati-logic': { icon: 'ganpati-logic', name: 'Ganpati Logic' },
}

const STAT_KEYS = {
  'modak-rush': [
    { key: 'modaksCollected', label: 'Modaks' },
    { key: 'goldenCollected', label: 'Golden' },
    { key: 'frenzyModaks', label: 'Frenzy' },
    { key: 'burntCollected', label: 'Burnt' },
    { key: 'dangerHit', label: 'Danger' },
    { key: 'maxCombo', label: 'Max Combo' },
  ],
  'diya-dash': [
    { key: 'level', label: 'Level' },
    { key: 'correct', label: 'Correct' },
    { key: 'accuracy', label: 'Accuracy', suffix: '%' },
  ],
  'dhol-battle': [
    { key: 'perfect', label: 'Perfect' },
    { key: 'good', label: 'Good' },
    { key: 'miss', label: 'Miss' },
    { key: 'accuracy', label: 'Accuracy', suffix: '%' },
  ],
  'rangoli-rush': [
    { key: 'rounds', label: 'Rounds' },
    { key: 'correct', label: 'Correct' },
    { key: 'accuracy', label: 'Accuracy', suffix: '%' },
  ],
  'mushak-maze': [
    { key: 'mazes', label: 'Mazes' },
    { key: 'bonuses', label: 'Bonuses' },
    { key: 'traps', label: 'Traps' },
  ],
  'ganpati-logic': [
    { key: 'questions', label: 'Questions' },
    { key: 'correct', label: 'Correct' },
    { key: 'accuracy', label: 'Accuracy', suffix: '%' },
    { key: 'streak', label: 'Streak' },
  ],
}

function AnimatedScore({ target }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!target || target === 0) return
    const duration = 1200
    const step = Math.ceil(target / (duration / 16))
    let val = 0
    const id = setInterval(() => {
      val += step
      if (val >= target) {
        val = target
        clearInterval(id)
      }
      setCurrent(val)
    }, 16)
    return () => clearInterval(id)
  }, [target])

  return <span>{current.toLocaleString()}</span>
}

function getOutcome(result) {
  switch (result) {
    case 'win':
      return { icon: Trophy, text: 'VICTORY!', color: 'var(--festival-gold)' }
    case 'loss':
      return { icon: Flag, text: 'GOOD GAME', color: 'var(--festival-saffron)' }
    case 'draw':
      return { icon: Award, text: 'DRAW', color: 'var(--secondary)' }
    default:
      return { icon: Gamepad2, text: 'GAME OVER', color: 'var(--text)' }
  }
}

export default function ResultScreen(props) {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}

  const gameId = props.gameId || state.gameId || 'modak-rush'
  const score = props.score ?? state.score ?? 0
  const isPersonalBest = props.isPersonalBest ?? state.isPersonalBest ?? false
  const previousBest = props.previousBest ?? state.previousBest
  const stats = props.stats || state.stats || {}
  const difficulty = props.difficulty || state.difficulty || 'normal'
  const newlyUnlockedTier = props.newlyUnlockedTier || state.newlyUnlockedTier
  const scoreBreakdown = props.scoreBreakdown || state.scoreBreakdown
  const opponentName = props.opponentName || state.opponentName
  const opponentScore = props.opponentScore ?? state.opponentScore
  const result = props.result || state.result
  const ratingChange = props.ratingChange ?? state.ratingChange
  const xpEarned = props.xpEarned ?? state.xpEarned

  const meta = GAME_META[gameId] || { icon: 'game', name: 'Game' }
  const statDefs = STAT_KEYS[gameId] || []
  const outcome = result ? getOutcome(result) : (isPersonalBest
    ? { icon: Trophy, text: 'NEW BEST!', color: 'var(--festival-gold)' }
    : { icon: Gamepad2, text: 'GAME OVER', color: 'var(--text)' })

  const tierConfig = DIFFICULTY_TIERS[difficulty] || DIFFICULTY_TIERS.normal
  const unlockedTierConfig = newlyUnlockedTier ? DIFFICULTY_TIERS[newlyUnlockedTier] : null

  const computedUP = useMemo(() => {
    if (props.universalPoints !== undefined) return { totalUP: props.universalPoints }
    if (state.universalPoints !== undefined) return { totalUP: state.universalPoints }
    return estimateUniversalPoints({
      gameId,
      score,
      duration: stats?.duration || 30,
      difficulty,
      stats,
      isPB: isPersonalBest,
      mpResult: result,
    })
  }, [props.universalPoints, state.universalPoints, gameId, score, stats, difficulty, isPersonalBest, result])

  const player = useMemo(() => getPlayer(), [])
  const nearMiss = useMemo(() => getNearMissInfo(score, previousBest), [score, previousBest])
  const rival = useMemo(() => getNextRivalTarget(player?.player_id || player?.id, computedUP?.totalUP), [player, computedUP])

  const [serverProgression, setServerProgression] = useState(null)
  const [serverXpEarned, setServerXpEarned] = useState(xpEarned || 25)
  const [serverXpBreakdown, setServerXpBreakdown] = useState(null)
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false)

  const submittedRef = useRef(false)
  useEffect(() => {
    if (submittedRef.current) return
    submittedRef.current = true

    const pid = player?.player_id || player?.id
    if (pid && score > 0 && !result) {
      submitScore(pid, score, stats?.duration || 30, {
        game_id: gameId,
        difficulty,
        stats,
      })
        .then((res) => {
          if (res?.new_universal_points !== undefined) {
            setUniversalPoints(res.new_universal_points)
          }
          if (res?.xp_awarded) {
            setServerXpEarned(res.xp_awarded)
          }
          if (res?.xp_breakdown) {
            setServerXpBreakdown(res.xp_breakdown)
          }
          if (res?.progression) {
            setServerProgression(res.progression)
            if (res.progression.leveled_up) {
              setShowLevelUpCelebration(true)
              triggerHaptic('heavy')
            }
          }
        })
        .catch(() => {})
    }
  }, [player, gameId, score, difficulty, stats, result])

  const currentProgression = useMemo(() => {
    if (serverProgression) return serverProgression
    const totalXp = Math.max(50, (player?.universal_points || 0) + (serverXpEarned || 25))
    const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 3000]
    let level = 1
    for (let i = 0; i < XP_THRESHOLDS.length; i++) {
      if (totalXp >= XP_THRESHOLDS[i]) level = i + 1
      else break
    }
    const currentThreshold = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)]
    const nextThreshold = XP_THRESHOLDS[Math.min(level, XP_THRESHOLDS.length - 1)] || currentThreshold + 500
    const progressXp = Math.max(0, totalXp - currentThreshold)
    const progressRequired = Math.max(1, nextThreshold - currentThreshold)
    return {
      level,
      total_xp: totalXp,
      progress_xp: progressXp,
      progress_required: progressRequired,
    }
  }, [serverProgression, player, serverXpEarned])

  const unlockedAvatar = useMemo(() => {
    return AVATAR_LIST.find((a) => a.unlockLevel === currentProgression.level) || null
  }, [currentProgression.level])

  const handlePlayAgain = useCallback(() => {
    triggerHaptic('light')
    if (props.onPlayAgain) {
      props.onPlayAgain()
    } else {
      navigate(`/game/${gameId}`)
    }
  }, [props, gameId, navigate])

  // Instant rematch hotkey (Space or Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        handlePlayAgain()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePlayAgain])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'radial-gradient(ellipse at center, rgba(30,10,50,0.95) 0%, rgba(0,0,0,0.98) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '20px 0',
      }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: 440,
          width: '92%',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <motion.div
          variants={item}
          style={{
            fontSize: '3.5rem',
            marginBottom: -4,
            animation: result === 'win' ? 'bounce 0.6s ease infinite alternate' : undefined,
          }}
        >
          {React.createElement(outcome.icon, { size: 52 })}
        </motion.div>

        <motion.h1
          variants={item}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            color: outcome.color,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {outcome.text}
        </motion.h1>

        {/* Game Title & Difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -6 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{meta.name}</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: tierConfig.color,
              background: tierConfig.bg,
              border: `1px solid ${tierConfig.border}`,
            }}
          >
            {tierConfig.name} ({tierConfig.multiplierLabel})
          </span>
        </div>

        {/* Unlocked Tier Banner */}
        {unlockedTierConfig && (
          <motion.div
            variants={item}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 14px',
              background: unlockedTierConfig.bg,
              border: `2px solid ${unlockedTierConfig.color}`,
              borderRadius: 'var(--radius-md)',
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: unlockedTierConfig.color, fontWeight: 900, fontSize: '0.88rem' }}>
              <Sparkles size={16} /> NEW DIFFICULTY UNLOCKED!
            </div>
            <div style={{ fontSize: '0.78rem', color: '#F3F4F6' }}>
              You unlocked <strong style={{ color: unlockedTierConfig.color }}>{unlockedTierConfig.name} Mode</strong> ({unlockedTierConfig.multiplierLabel} multiplier)!
            </div>
          </motion.div>
        )}

        {opponentName && (
          <motion.div
            variants={item}
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>You</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{score}</span>
            <span>vs</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{opponentScore}</span>
            <span>{opponentName}</span>
          </motion.div>
        )}

        {!opponentName && (
          <motion.div variants={item} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: 'var(--festival-gold)',
              }}
            >
              <AnimatedScore target={score} />
            </div>
            {previousBest != null && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                Best: {Math.round(previousBest).toLocaleString()}
              </div>
            )}
          </motion.div>
        )}

        {isPersonalBest && !unlockedTierConfig && (
          <motion.div
            variants={item}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,153,51,0.15))',
              border: '1px solid var(--festival-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 18px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              color: 'var(--festival-gold)',
              boxShadow: '0 0 20px rgba(255,215,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Star size={16} />
            NEW PERSONAL BEST!
          </motion.div>
        )}

        {/* Near-Miss Alert Banner (if not PB and within reach) */}
        {!isPersonalBest && nearMiss?.isNearMiss && (
          <motion.div
            variants={item}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(255, 107, 53, 0.15) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.55)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, color: '#FBBF24' }}>
                <Zap size={15} /> SO CLOSE TO HIGH SCORE!
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FCD34D', fontFamily: 'var(--font-mono)' }}>
                {nearMiss.pct}% of PB
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#FFF', fontWeight: 600, textAlign: 'left' }}>
              {nearMiss.message}
            </div>
            <div style={{ width: '100%', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nearMiss.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #F59E0B, #FFD700)', borderRadius: 3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Leaderboard Next Rival Target Card */}
        {rival && !rival.isChampion && (
          <motion.div
            variants={item}
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 215, 0, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 12px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <PlayerAvatar avatar={rival.rivalAvatar} size={34} />
              <div style={{ minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: '0.65rem', color: '#FBBF24', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                  🎯 Next Rival Target (#{rival.rivalRank})
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Catch {rival.rivalName}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FFD700', fontFamily: 'var(--font-mono)' }}>
                -{rival.upGap} <span style={{ fontSize: '0.65rem' }}>UP</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Gap to beat</div>
            </div>
          </motion.div>
        )}

        {/* Score breakdown if available */}
        {scoreBreakdown && (
          <motion.div
            variants={item}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              width: '100%',
              fontSize: '0.75rem',
              border: '1px solid rgba(255,255,255,0.06)',
              boxSizing: 'border-box',
            }}
          >
            {scoreBreakdown.base !== undefined && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Base: </span>
                <strong style={{ color: '#F3F4F6', fontFamily: 'var(--font-mono)' }}>{scoreBreakdown.base}</strong>
              </div>
            )}
            {scoreBreakdown.maxCombo !== undefined && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Combo: </span>
                <strong style={{ color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>{scoreBreakdown.maxCombo}x</strong>
              </div>
            )}
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Multiplier: </span>
              <strong style={{ color: tierConfig.color, fontFamily: 'var(--font-mono)' }}>{tierConfig.multiplierLabel}</strong>
            </div>
          </motion.div>
        )}

        {/* Universal Points Earned */}
        <motion.div
          variants={item}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 107, 53, 0.15) 100%)',
            border: '2px solid rgba(255, 215, 0, 0.45)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 215, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFD700',
              }}
            >
              <Crown size={16} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Universal Points
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFF', fontFamily: 'var(--font-mono)' }}>
                +{typeof computedUP === 'object' ? (computedUP.totalUP ?? 0) : computedUP} <span style={{ fontSize: '0.75rem', color: '#FFD700' }}>UP</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Competitive Rank
          </div>
        </motion.div>

        {ratingChange != null && (
          <motion.div
            variants={item}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              color: ratingChange >= 0 ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {ratingChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {ratingChange >= 0 ? '+' : ''}{ratingChange} Rating
          </motion.div>
        )}

        {statDefs.length > 0 && stats && (
          <motion.div
            variants={item}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(statDefs.length, 3)}, 1fr)`,
              gap: 8,
              width: '100%',
            }}
          >
            {statDefs.map((s) => (
              <div
                key={s.key}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 6px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  {stats[s.key] ?? 0}{s.suffix || ''}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    marginTop: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Dynamic XP & Level Progress Card */}
        <motion.div
          variants={item}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 15, 50, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1.5px solid rgba(255, 215, 0, 0.28)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="#FFD700" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFD700' }}>
                +{serverXpEarned || 25} XP GAINED
              </span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#FFF',
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Level {currentProgression.level}</span>
            </span>
          </div>

          {/* Real Animated XP Progress Track */}
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, Math.round((currentProgression.progress_xp / currentProgression.progress_required) * 100))}%`,
              }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(90deg, #FF6B35 0%, #FFD700 100%)',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {currentProgression.progress_xp} / {currentProgression.progress_required} XP ({Math.min(100, Math.round((currentProgression.progress_xp / currentProgression.progress_required) * 100))}%)
            </span>
            <span style={{ color: '#FBBF24', fontWeight: 700 }}>
              {Math.max(0, currentProgression.progress_required - currentProgression.progress_xp)} XP to Level {currentProgression.level + 1}
            </span>
          </div>

          {/* XP Breakdown Chips */}
          {serverXpBreakdown && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                Base: <strong style={{ color: '#FFF' }}>+{serverXpBreakdown.base_xp}</strong>
              </span>
              {serverXpBreakdown.skill_xp > 0 && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                  Skill: <strong style={{ color: '#4ADE80' }}>+{serverXpBreakdown.skill_xp}</strong>
                </span>
              )}
              {serverXpBreakdown.difficulty_multiplier > 1 && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                  Tier: <strong style={{ color: tierConfig.color }}>x{serverXpBreakdown.difficulty_multiplier}</strong>
                </span>
              )}
              {serverXpBreakdown.pb_bonus > 0 && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(255,215,0,0.12)', padding: '2px 6px', borderRadius: 4, color: '#FFD700', fontWeight: 700 }}>
                  PB: +{serverXpBreakdown.pb_bonus}
                </span>
              )}
              {serverXpBreakdown.combo_bonus > 0 && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(255,107,53,0.15)', padding: '2px 6px', borderRadius: 4, color: '#FF8C42', fontWeight: 700 }}>
                  Combo: +{serverXpBreakdown.combo_bonus}
                </span>
              )}
              {serverXpBreakdown.achievements_xp > 0 && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(192,132,252,0.15)', padding: '2px 6px', borderRadius: 4, color: '#C084FC', fontWeight: 700 }}>
                  Achievement: +{serverXpBreakdown.achievements_xp}
                </span>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={item}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
            marginTop: 4,
          }}
        >
          {/* Newly Unlocked CTA */}
          {unlockedTierConfig && (
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/game/${gameId}`)}
              style={{
                width: '100%',
                height: 48,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${unlockedTierConfig.color}, #f59e0b)`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              TRY {unlockedTierConfig.name.toUpperCase()} MODE <ArrowRight size={18} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: [
                '0 0 16px rgba(255,153,51,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                '0 0 28px rgba(255,215,0,0.65), 0 4px 14px rgba(0,0,0,0.4)',
                '0 0 16px rgba(255,153,51,0.4), 0 4px 12px rgba(0,0,0,0.3)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            onClick={handlePlayAgain}
            style={{
              width: '100%',
              height: 52,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)',
              fontSize: '1.02rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--festival-saffron), var(--festival-gold))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              letterSpacing: '0.02em',
            }}
          >
            <RotateCcw size={18} />
            <span>PLAY AGAIN</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '2px 7px', borderRadius: 4 }}>
              Space / Enter
            </span>
          </motion.button>

          {/* Secondary Actions Grid: Next Game, Game Hub, Home */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', marginTop: 4 }}>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const games = ['modak-rush', 'diya-dash', 'dhol-battle', 'rangoli-rush', 'mushak-maze', 'ganpati-logic']
                const next = games[(games.indexOf(gameId) + 1) % games.length]
                navigate(`/game/${next}/mode`)
              }}
              style={{
                height: 42,
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <ArrowRight size={15} /> Next Game
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/games')}
              style={{
                height: 42,
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Gamepad2 size={15} /> Game Hub
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/')}
              style={{
                height: 42,
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Home size={15} /> Home
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Level-Up Celebration Modal */}
      <AnimatePresence>
        {showLevelUpCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10, 5, 25, 0.92)',
              backdropFilter: 'blur(10px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                maxWidth: 380,
                width: '100%',
                background: 'linear-gradient(180deg, rgba(35, 20, 60, 0.98) 0%, rgba(15, 8, 30, 0.98) 100%)',
                border: '2px solid #FFD700',
                borderRadius: 'var(--radius-xl, 20px)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                boxShadow: '0 0 50px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ fontSize: '2.5rem' }}
              >
                🎉
              </motion.div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFD700', letterSpacing: '0.04em' }}>
                LEVEL UP!
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF' }}>
                You reached Level {currentProgression.level}!
              </div>

              {unlockedAvatar && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '14px 16px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1.5px dashed rgba(255, 215, 0, 0.6)',
                    borderRadius: 'var(--radius-lg, 14px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ✨ Sacred Insignia Unlocked!
                  </span>
                  <PlayerAvatar avatar={unlockedAvatar.id} size={64} showGlow />
                  <div style={{ fontWeight: 800, color: '#FFF', fontSize: '0.95rem' }}>
                    {unlockedAvatar.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {unlockedAvatar.description}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowLevelUpCelebration(false)}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: '0.85rem 1.5rem',
                  borderRadius: 'var(--radius-full, 9999px)',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FFD700 100%)',
                  border: 'none',
                  color: '#1a0800',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 16px rgba(255, 107, 53, 0.4)',
                }}
              >
                CONTINUE BLITZ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
