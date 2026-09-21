import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  RotateCcw,
  Home,
  Star,
  Sparkles,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  Crown,
  Gamepad2,
  TrendingUp,
} from 'lucide-react'
import { DIFFICULTY_TIERS, DIFFICULTY_ORDER } from '../../config/difficulties'
import { estimateUniversalPoints } from '../../config/universalPoints'
import { GAME_LIST } from '../../config/games'
import { isTierUnlocked } from '../../utils/progression'
import { getPlayer } from '../../utils/storage'
import { getNearMissInfo, getNextRivalTarget } from '../../utils/rivalry'
import { triggerHaptic } from '../../utils/haptics'
import PlayerAvatar from '../../components/PlayerAvatar'
import { AVATAR_LIST } from '../../config/avatars'

const GAME_IDS = ['modak-rush', 'diya-dash', 'dhol-battle', 'rangoli-rush', 'mushak-maze', 'ganpati-logic']

export default function GameResult({
  gameId,
  gameIcon,
  gameName,
  score = 0,
  bestScore,
  isPersonalBest,
  previousBest,
  difficulty = 'normal',
  scoreBreakdown,
  newlyUnlockedTier,
  onNextDifficulty,
  stats,
  universalPoints,
  universalPointsBreakdown,
  globalRank,
  isRankImproved,
  xpEarned = 35,
  onPlayAgain,
  onRestart,
}) {
  const navigate = useNavigate()
  const [showUPBreakdown, setShowUPBreakdown] = useState(false)
  const playAgain = onPlayAgain || onRestart
  const resolvedBest = bestScore ?? previousBest ?? 0
  const tierConfig = DIFFICULTY_TIERS[difficulty] || DIFFICULTY_TIERS.normal

  // Universal Points calculation or fallback estimate (must be declared before rival useMemo)
  const computedUP = useMemo(() => {
    if (universalPoints !== undefined && universalPoints !== null) {
      return {
        totalUP: universalPoints,
        base: universalPointsBreakdown?.base ?? 25,
        performanceNormalized: universalPointsBreakdown?.performance_normalized ?? 50,
        multiplier: universalPointsBreakdown?.difficulty_multiplier ?? tierConfig.multiplier,
        subtotal: universalPointsBreakdown?.subtotal ?? 75,
        comboBonus: universalPointsBreakdown?.combo_bonus ?? 0,
        accBonus: universalPointsBreakdown?.acc_bonus ?? 0,
        pbBonus: universalPointsBreakdown?.pb_bonus ?? (isPersonalBest ? 10 : 0),
        totalBonuses: universalPointsBreakdown?.bonuses ?? (isPersonalBest ? 10 : 0),
      }
    }
    return estimateUniversalPoints({
      gameId,
      score,
      duration: stats?.duration || 30,
      difficulty,
      stats: {
        ...stats,
        base: scoreBreakdown?.base,
        accuracy: scoreBreakdown?.accuracy,
        maxCombo: scoreBreakdown?.maxCombo,
      },
      isPB: isPersonalBest,
    })
  }, [universalPoints, universalPointsBreakdown, tierConfig.multiplier, gameId, score, stats, difficulty, scoreBreakdown, isPersonalBest])

  const player = useMemo(() => getPlayer(), [])
  const nearMiss = useMemo(() => getNearMissInfo(score, resolvedBest), [score, resolvedBest])
  const rival = useMemo(() => getNextRivalTarget(player?.player_id || player?.id, computedUP?.totalUP), [player, computedUP])

  const currentProgression = useMemo(() => {
    const totalXp = Math.max(50, (player?.universal_points || 0) + (xpEarned || 25))
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
  }, [player, xpEarned])

  const handlePlayAgainClick = useCallback(() => {
    triggerHaptic('light')
    playAgain?.()
  }, [playAgain])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        handlePlayAgainClick()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePlayAgainClick])

  // Next game in arcade sequence
  const currentIndex = GAME_IDS.indexOf(gameId)
  const nextGameId = GAME_IDS[(currentIndex + 1) % GAME_IDS.length]
  const nextGame = GAME_LIST.find((g) => g.id === nextGameId)

  // Check if a higher tier is unlocked
  const currentTierIndex = DIFFICULTY_ORDER.indexOf(difficulty)
  const higherTierId =
    newlyUnlockedTier ||
    (currentTierIndex >= 0 && currentTierIndex < DIFFICULTY_ORDER.length - 1
      ? DIFFICULTY_ORDER[currentTierIndex + 1]
      : null)
  const isHigherTierAvailable = higherTierId && isTierUnlocked(gameId, higherTierId)
  const higherTierConfig = isHigherTierAvailable ? DIFFICULTY_TIERS[higherTierId] : null

  const handleNextGame = () => {
    navigate(`/game/${nextGameId}/mode`)
  }

  const handleGameHub = () => {
    navigate('/games')
  }

  const handleHome = () => {
    navigate('/')
  }

  const handleTryHigherDifficulty = () => {
    if (onNextDifficulty && higherTierId) {
      onNextDifficulty(higherTierId)
    } else if (higherTierId) {
      navigate(`/game/${gameId}/instructions?diff=${higherTierId}`)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 5, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        style={{
          background: 'rgba(18, 12, 38, 0.98)',
          borderRadius: 'var(--radius-xl, 22px)',
          padding: '1.75rem 1.4rem',
          maxWidth: 450,
          width: '100%',
          textAlign: 'center',
          border: '2px solid rgba(255, 209, 102, 0.3)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 25px rgba(255, 209, 102, 0.1)',
          position: 'relative',
        }}
      >
        {/* Game Emblem / Trophy Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 10 }}
          style={{
            fontSize: '3rem',
            marginBottom: '0.25rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {isPersonalBest ? <Trophy size={48} color="#FFD700" /> : gameIcon || <Gamepad2 size={44} color="#FFB347" />}
        </motion.div>

        {/* Title */}
        <h2
          style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            margin: '0 0 0.2rem',
            background: isPersonalBest
              ? 'linear-gradient(135deg, #FFD700, #FFF59D)'
              : 'linear-gradient(135deg, #FF6B35, #FFD166)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-display, inherit)',
            letterSpacing: '0.04em',
          }}
        >
          {isPersonalBest ? 'NEW PERSONAL BEST!' : 'GAME COMPLETE'}
        </h2>

        {/* Game Name & Difficulty Multiplier Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: '0.85rem', fontWeight: 600 }}>
            {gameName}
          </span>
          <span
            style={{
              padding: '0.15rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: tierConfig.color,
              background: tierConfig.bg,
              border: `1px solid ${tierConfig.border}`,
              letterSpacing: '0.04em',
            }}
          >
            {tierConfig.name} ({tierConfig.multiplierLabel})
          </span>
        </div>

        {/* Global Rank Improvement Alert if applicable */}
        {(isRankImproved || (globalRank && globalRank <= 50)) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '9999px',
              color: '#4ADE80',
              fontSize: '0.78rem',
              fontWeight: 800,
              marginBottom: '0.85rem',
            }}
          >
            <TrendingUp size={14} />
            <span>GLOBAL RANK IMPROVED {globalRank ? `(#${globalRank})` : ''}</span>
          </motion.div>
        )}

        {/* Scores Display */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Final Score
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#FFD700' }}>
              {Math.round(score).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Personal Best
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-muted, #9CA3AF)' }}>
              {Math.round(Math.max(score, resolvedBest)).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Near-Miss Alert Banner (if not PB and within reach) */}
        {!isPersonalBest && nearMiss?.isNearMiss && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(255, 107, 53, 0.15) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.55)',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '10px 14px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginBottom: '0.85rem',
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 215, 0, 0.28)',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '9px 12px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: '0.85rem',
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

        {/* Universal Points Award Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.14) 0%, rgba(255, 107, 53, 0.15) 100%)',
            border: '2px solid rgba(255, 215, 0, 0.45)',
            borderRadius: 'var(--radius-lg, 14px)',
            padding: '0.85rem 1rem',
            marginBottom: '0.85rem',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 215, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFD700',
                  flexShrink: 0,
                }}
              >
                <Crown size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Universal Points Earned
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFF', fontFamily: 'var(--font-mono)' }}>
                  +{computedUP.totalUP} <span style={{ fontSize: '0.8rem', color: '#FFD700' }}>UP</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#F1F5F9',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                +{xpEarned} XP
              </span>

              <button
                type="button"
                onClick={() => setShowUPBreakdown(!showUPBreakdown)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.5rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                {showUPBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showUPBreakdown ? 'Hide' : 'Details'}
              </button>
            </div>
          </div>

          {/* Expandable Breakdown Accordion */}
          <AnimatePresence>
            {showUPBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Base Completion:</span>
                  <strong style={{ color: '#FFF' }}>+{computedUP.base} UP</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Normalized Score:</span>
                  <strong style={{ color: '#4ADE80' }}>+{computedUP.performanceNormalized} pts</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Difficulty ({tierConfig.name}):</span>
                  <strong style={{ color: tierConfig.color }}>x{computedUP.multiplier}</strong>
                </div>
                {computedUP.totalBonuses > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Bonuses (Streak/PB):</span>
                    <strong style={{ color: '#FBBF24' }}>+{computedUP.totalBonuses} UP</strong>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Summary Pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.4rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={styles.miniStat}>
            <span style={styles.miniStatLabel}>Accuracy</span>
            <span style={styles.miniStatValue}>{scoreBreakdown?.accuracy ?? 92}%</span>
          </div>
          <div style={styles.miniStat}>
            <span style={styles.miniStatLabel}>Max Combo</span>
            <span style={styles.miniStatValue}>{scoreBreakdown?.maxCombo ?? stats?.maxCombo ?? 5}x</span>
          </div>
          <div style={styles.miniStat}>
            <span style={styles.miniStatLabel}>Tier</span>
            <span style={{ ...styles.miniStatValue, color: tierConfig.color, textTransform: 'uppercase' }}>
              {tierConfig.name}
            </span>
          </div>
        </div>

        {/* Level Progression Progress Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 15, 50, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1.5px solid rgba(255, 215, 0, 0.25)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '10px 14px',
            marginBottom: '1.1rem',
            textAlign: 'left',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, color: '#FFD700' }}>
              <Sparkles size={14} /> +{xpEarned || 25} XP GAINED
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
              }}
            >
              Level {currentProgression.level}
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 7,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              marginBottom: 6,
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {currentProgression.progress_xp} / {currentProgression.progress_required} XP
            </span>
            <span style={{ color: '#FBBF24', fontWeight: 700 }}>
              {Math.max(0, currentProgression.progress_required - currentProgression.progress_xp)} XP to Level {currentProgression.level + 1}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS (PRIMARY: PLAY AGAIN) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* PRIMARY BUTTON: PLAY AGAIN */}
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: [
                '0 0 16px rgba(255,153,51,0.4), 0 4px 14px rgba(0,0,0,0.3)',
                '0 0 28px rgba(255,215,0,0.65), 0 4px 16px rgba(0,0,0,0.4)',
                '0 0 16px rgba(255,153,51,0.4), 0 4px 14px rgba(0,0,0,0.3)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            onClick={handlePlayAgainClick}
            style={{
              ...styles.primaryActionBtn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={18} />
            <span>PLAY AGAIN</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '2px 7px', borderRadius: 4 }}>
              Space / Enter
            </span>
          </motion.button>

          {/* SECONDARY: TRY HIGHER DIFFICULTY */}
          {isHigherTierAvailable && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTryHigherDifficulty}
              style={{
                ...styles.secondaryActionBtn,
                background: `linear-gradient(135deg, ${higherTierConfig.bg}, rgba(255,255,255,0.06))`,
                borderColor: higherTierConfig.color,
                color: higherTierConfig.color,
              }}
            >
              <Sparkles size={16} /> TRY {higherTierConfig.name.toUpperCase()} MODE ({higherTierConfig.multiplierLabel})
            </motion.button>
          )}

          {/* SECONDARY ROW: NEXT GAME, GAME HUB, HOME */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
            {/* NEXT GAME */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNextGame}
              style={styles.subActionBtn}
              title={`Next: ${nextGame?.name}`}
            >
              <ArrowRight size={15} /> Next Game
            </motion.button>

            {/* GAME HUB */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGameHub}
              style={styles.subActionBtn}
            >
              <Gamepad2 size={15} /> Game Hub
            </motion.button>

            {/* HOME */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleHome}
              style={styles.subActionBtn}
            >
              <Home size={15} /> Home
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const styles = {
  miniStat: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-md, 8px)',
    padding: '0.45rem 0.2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: '0.62rem',
    color: 'var(--text-muted, #9CA3AF)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  miniStatValue: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#F1F5F9',
    fontFamily: 'var(--font-mono, monospace)',
    marginTop: '0.1rem',
  },
  primaryActionBtn: {
    width: '100%',
    padding: '0.95rem 1.5rem',
    fontSize: '1.05rem',
    fontWeight: 900,
    fontFamily: 'var(--font-display, inherit)',
    color: '#0C081C',
    background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
    border: 'none',
    borderRadius: 'var(--radius-xl, 16px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 6px 22px rgba(255, 140, 66, 0.45)',
    letterSpacing: '0.04em',
  },
  secondaryActionBtn: {
    width: '100%',
    padding: '0.75rem 1.2rem',
    fontSize: '0.85rem',
    fontWeight: 800,
    fontFamily: 'var(--font-sans, inherit)',
    borderRadius: 'var(--radius-lg, 12px)',
    border: '1px solid',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
  },
  subActionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    padding: '0.65rem 0.4rem',
    borderRadius: 'var(--radius-md, 10px)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: 'var(--text-muted, #9CA3AF)',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans, inherit)',
    transition: 'all 0.2s ease',
  },
}
