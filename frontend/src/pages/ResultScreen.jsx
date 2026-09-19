import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Trophy, RotateCcw, Home, Star, TrendingUp, TrendingDown, Gamepad2, Flag, Award, Sparkles, ArrowRight, Crown } from 'lucide-react'
import { DIFFICULTY_TIERS } from '../config/difficulties'
import { estimateUniversalPoints } from '../config/universalPoints'

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

  const handlePlayAgain = () => {
    if (props.onPlayAgain) {
      props.onPlayAgain()
    } else {
      navigate(`/game/${gameId}`)
    }
  }

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
                +{computedUP.totalUP ?? computedUP} <span style={{ fontSize: '0.75rem', color: '#FFD700' }}>UP</span>
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

        {xpEarned != null && xpEarned > 0 && (
          <motion.div variants={item} style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                color: 'var(--text)',
                marginBottom: 6,
              }}
            >
              <span>+{xpEarned} XP</span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(90deg, var(--festival-saffron), var(--festival-gold))',
                }}
              />
            </div>
          </motion.div>
        )}

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
            onClick={handlePlayAgain}
            style={{
              width: '100%',
              height: 50,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--festival-saffron), var(--festival-gold))',
              color: '#fff',
              boxShadow: '0 0 20px rgba(255,153,51,0.4), 0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={18} />
            PLAY AGAIN
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
    </div>
  )
}
