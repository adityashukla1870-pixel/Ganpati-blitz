import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Sparkles, Zap, Flame, Crown, Lock, ArrowRight, Trophy } from 'lucide-react'
import { getGame } from '../config/games'
import { DIFFICULTY_ORDER, DIFFICULTY_TIERS, getUnlockRequirement } from '../config/difficulties'
import { isTierUnlocked, getTierBestScore, setSelectedDifficulty } from '../utils/progression'
import BackButton from '../components/BackButton'

const TIER_ICONS = {
  easy: Shield,
  normal: Sparkles,
  hard: Zap,
  expert: Flame,
  master: Crown,
}

const SKILL_LEVELS = {
  easy: 'Beginner / First-Time Players',
  normal: 'Standard Arcade Players',
  hard: 'Skilled Competitors',
  expert: 'Hardcore Blitzers',
  master: 'Grandmaster Mastery',
}

export default function DifficultyScreen() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = getGame(gameId)
  const [lockedNotice, setLockedNotice] = useState(null)

  if (!game) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#FFF' }}>Game not found.</p>
        <BackButton to="/games" label="Return to Game Hub" />
      </div>
    )
  }

  const handleSelectTier = (tierId) => {
    if (isTierUnlocked(game.id, tierId)) {
      setSelectedDifficulty(game.id, tierId)
      navigate(`/game/${game.id}/instructions?diff=${tierId}`)
    } else {
      const req = getUnlockRequirement(game.id, tierId)
      setLockedNotice({
        tier: tierId,
        message: req?.label || 'Achieve the target score on previous difficulty to unlock!',
      })
      setTimeout(() => setLockedNotice(null), 3500)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '1.25rem 1rem 4rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          maxWidth: 780,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Top Bar with Back to Game Mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackButton to={`/game/${game.id}/mode`} label="Game Mode" />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9CA3AF)', fontWeight: 600 }}>
            Step 2 of 3: Select Difficulty
          </div>
        </div>

        {/* Title Header */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: '0 0 0.35rem',
              fontSize: 'clamp(1.7rem, 5vw, 2.3rem)',
              fontWeight: 900,
              fontFamily: 'var(--font-display, inherit)',
              color: '#FFF',
            }}
          >
            SELECT DIFFICULTY
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #9CA3AF)' }}>
            Choose your challenge tier for {game.name}. Higher tiers multiply your final score and Universal Points!
          </p>
        </div>

        {/* Locked Alert Notice */}
        <AnimatePresence>
          {lockedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-md, 10px)',
                color: '#FCA5A5',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <Lock size={16} />
              <span>{lockedNotice.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5 Difficulty Tier Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {DIFFICULTY_ORDER.map((tierId) => {
            const tier = DIFFICULTY_TIERS[tierId]
            const unlocked = isTierUnlocked(game.id, tierId)
            const TierIcon = TIER_ICONS[tierId] || Sparkles
            const pb = getTierBestScore(game.id, tierId)
            const req = getUnlockRequirement(game.id, tierId)

            return (
              <motion.div
                key={tierId}
                whileHover={unlocked ? { scale: 1.015, x: 4 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => handleSelectTier(tierId)}
                style={{
                  background: unlocked
                    ? `linear-gradient(90deg, ${tier.bg} 0%, rgba(15, 12, 34, 0.9) 100%)`
                    : 'rgba(15, 12, 34, 0.5)',
                  border: unlocked
                    ? `2px solid ${tier.border}`
                    : '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-xl, 16px)',
                  padding: '1.15rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.6,
                  boxShadow: unlocked ? `0 4px 20px ${tier.bg}` : 'none',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left: Icon & Description Block */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-lg, 12px)',
                      background: tier.bg,
                      border: `1px solid ${tier.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tier.color,
                      flexShrink: 0,
                    }}
                  >
                    {unlocked ? <TierIcon size={24} /> : <Lock size={20} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                      <span
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 900,
                          color: tier.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {tier.name}
                      </span>
                      <span
                        style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          background: tier.bg,
                          border: `1px solid ${tier.border}`,
                          color: tier.color,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {tier.multiplierLabel} MULTIPLIER
                      </span>
                      {!unlocked && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#EF4444',
                            background: 'rgba(239, 68, 68, 0.15)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          LOCKED
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#E2E8F0', marginBottom: '0.2rem' }}>
                      {tier.desc}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #9CA3AF)' }}>
                      Recommended for: <strong style={{ color: '#F1F5F9' }}>{SKILL_LEVELS[tierId]}</strong>
                    </div>

                    {!unlocked && req && (
                      <div style={{ fontSize: '0.74rem', color: '#FCA5A5', marginTop: '0.3rem', fontWeight: 600 }}>
                        🔒 Unlock condition: {req.label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Personal Best & Continue Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                  {unlocked && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Tier Best
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFD166', fontFamily: 'var(--font-mono)' }}>
                        {pb > 0 ? pb.toLocaleString() : '---'}
                      </div>
                    </div>
                  )}

                  {unlocked ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '0.65rem 1.15rem',
                        borderRadius: 'var(--radius-md, 10px)',
                        border: 'none',
                        background: `linear-gradient(135deg, ${tier.color}, #f59e0b)`,
                        color: '#000',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      SELECT <ArrowRight size={15} />
                    </motion.button>
                  ) : (
                    <div
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: 'var(--radius-md, 10px)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Lock size={14} /> LOCKED
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
