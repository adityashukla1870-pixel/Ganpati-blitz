import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, Zap, Shield, Flame, Crown } from 'lucide-react'
import { DIFFICULTY_ORDER, DIFFICULTY_TIERS, getUnlockRequirement } from '../config/difficulties'
import { isTierUnlocked, getTierBestScore } from '../utils/progression'

const TIER_ICONS = {
  easy: Shield,
  normal: Sparkles,
  hard: Zap,
  expert: Flame,
  master: Crown,
}

export default function DifficultySelector({
  gameId,
  selectedTier,
  onChange,
  showDescription = true,
  compact = false,
}) {
  const [lockedNotice, setLockedNotice] = useState(null)

  const handleSelect = (tierId) => {
    if (isTierUnlocked(gameId, tierId)) {
      setLockedNotice(null)
      onChange?.(tierId)
    } else {
      const req = getUnlockRequirement(gameId, tierId)
      setLockedNotice({
        tier: tierId,
        message: req?.label || 'Achieve higher score on the previous tier to unlock!',
      })
      setTimeout(() => setLockedNotice(null), 3000)
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Locked Notice Alert */}
      <AnimatePresence>
        {lockedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              padding: '0.5rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md, 8px)',
              color: '#FCA5A5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Lock size={14} />
            <span>{lockedNotice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tiers row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: compact ? '0.35rem' : '0.5rem',
          width: '100%',
        }}
      >
        {DIFFICULTY_ORDER.map((tierId) => {
          const tier = DIFFICULTY_TIERS[tierId]
          const isSelected = selectedTier === tierId
          const unlocked = isTierUnlocked(gameId, tierId)
          const TierIcon = TIER_ICONS[tierId] || Sparkles
          const tierBest = getTierBestScore(gameId, tierId)

          return (
            <motion.button
              key={tierId}
              type="button"
              whileHover={unlocked ? { scale: 1.03 } : { scale: 0.98 }}
              whileTap={unlocked ? { scale: 0.96 } : {}}
              onClick={() => handleSelect(tierId)}
              title={unlocked ? `${tier.name}: ${tier.multiplierLabel} multiplier` : getUnlockRequirement(gameId, tierId)?.label || 'Locked'}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: compact ? '0.45rem 0.25rem' : '0.65rem 0.35rem',
                background: isSelected
                  ? tier.bg
                  : unlocked
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(255, 255, 255, 0.015)',
                border: isSelected
                  ? `2px solid ${tier.color}`
                  : unlocked
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg, 12px)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                opacity: unlocked ? 1 : 0.5,
                transition: 'all 0.2s ease',
                boxShadow: isSelected
                  ? `0 0 16px ${tier.border}, inset 0 0 12px ${tier.bg}`
                  : 'none',
              }}
            >
              {/* Icon or Lock */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem',
                  color: isSelected ? tier.color : unlocked ? 'var(--text-muted, #9CA3AF)' : '#6B7280',
                }}
              >
                {unlocked ? <TierIcon size={compact ? 16 : 18} /> : <Lock size={compact ? 14 : 16} />}
              </div>

              {/* Name */}
              <span
                style={{
                  fontSize: compact ? '0.7rem' : '0.8rem',
                  fontWeight: 800,
                  color: isSelected ? tier.color : unlocked ? '#F3F4F6' : '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {tier.name}
              </span>

              {/* Multiplier Tag */}
              <span
                style={{
                  fontSize: compact ? '0.6rem' : '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: isSelected ? tier.color : 'var(--text-muted, #9CA3AF)',
                  marginTop: '0.15rem',
                }}
              >
                {tier.multiplierLabel}
              </span>

              {/* Best badge if any */}
              {unlocked && tierBest > 0 && !compact && (
                <span
                  style={{
                    fontSize: '0.55rem',
                    color: 'var(--festival-gold, #FBBF24)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    marginTop: '0.2rem',
                  }}
                >
                  PB: {tierBest > 999 ? `${(tierBest / 1000).toFixed(1)}k` : tierBest}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Active tier description banner */}
      {showDescription && (
        <div
          style={{
            padding: '0.6rem 0.85rem',
            background: DIFFICULTY_TIERS[selectedTier]?.bg || 'rgba(255,255,255,0.04)',
            border: `1px solid ${DIFFICULTY_TIERS[selectedTier]?.border || 'rgba(255,255,255,0.1)'}`,
            borderRadius: 'var(--radius-md, 8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontSize: '0.78rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontWeight: 700, color: DIFFICULTY_TIERS[selectedTier]?.color }}>
              {DIFFICULTY_TIERS[selectedTier]?.name} Mode ({DIFFICULTY_TIERS[selectedTier]?.multiplierLabel} Score Multiplier)
            </span>
            <span style={{ color: 'var(--text-muted, #9CA3AF)' }}>
              {DIFFICULTY_TIERS[selectedTier]?.desc}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
