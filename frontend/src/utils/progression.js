// Player progression, difficulty unlocking, and per-tier best score tracking
import { DIFFICULTY_ORDER, DIFFICULTY_TIERS, GAME_UNLOCK_THRESHOLDS } from '../config/difficulties'
import { getBestScore, setBestScore } from './storage'

const UNLOCKED_KEY_PREFIX = 'ganpati_unlocked_diff_'
const SELECTED_KEY_PREFIX = 'ganpati_selected_diff_'
const TIER_BEST_PREFIX = 'ganpati_best_'

/**
 * Get list of unlocked tier IDs for a game
 */
export function getUnlockedTiers(gameId) {
  try {
    const raw = localStorage.getItem(`${UNLOCKED_KEY_PREFIX}${gameId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Easy & Normal are always present
        const tiers = new Set(['easy', 'normal', ...parsed])
        return DIFFICULTY_ORDER.filter((t) => tiers.has(t))
      }
    }
  } catch (e) {
    console.error('Error reading unlocked tiers', e)
  }
  return ['easy', 'normal']
}

export const getUnlockedDifficulties = getUnlockedTiers

/**
 * Check if a specific tier is unlocked for a game
 */
export function isTierUnlocked(gameId, tierId) {
  const unlocked = getUnlockedTiers(gameId)
  return unlocked.includes(tierId)
}

/**
 * Unlock a tier for a game
 */
export function unlockTier(gameId, tierId) {
  const current = getUnlockedTiers(gameId)
  if (!current.includes(tierId)) {
    const updated = [...current, tierId]
    localStorage.setItem(`${UNLOCKED_KEY_PREFIX}${gameId}`, JSON.stringify(updated))
    return true
  }
  return false
}

/**
 * Get active selected difficulty for a game
 */
export function getSelectedDifficulty(gameId) {
  const unlocked = getUnlockedTiers(gameId)
  const saved = localStorage.getItem(`${SELECTED_KEY_PREFIX}${gameId}`)
  if (saved && unlocked.includes(saved)) {
    return saved
  }
  // Default to normal if unlocked, else easy
  return unlocked.includes('normal') ? 'normal' : 'easy'
}

/**
 * Set active selected difficulty for a game
 */
export function setSelectedDifficulty(gameId, tierId) {
  if (isTierUnlocked(gameId, tierId)) {
    localStorage.setItem(`${SELECTED_KEY_PREFIX}${gameId}`, tierId)
    return true
  }
  return false
}

/**
 * Get best score for a specific game and difficulty tier
 */
export function getTierBestScore(gameId, tierId) {
  const key = `${TIER_BEST_PREFIX}${gameId.replace(/-/g, '_')}_${tierId}`
  return parseInt(localStorage.getItem(key) || '0', 10)
}

/**
 * Record a score for a specific game and tier.
 * Returns { isTierPB, isGlobalPB, newlyUnlockedTier }
 */
export function recordGameResult(gameId, tierId, score) {
  const numScore = Math.max(0, Math.round(score))
  const tierKey = `${TIER_BEST_PREFIX}${gameId.replace(/-/g, '_')}_${tierId}`
  const prevTierBest = getTierBestScore(gameId, tierId)
  const isTierPB = numScore > prevTierBest

  if (isTierPB) {
    localStorage.setItem(tierKey, numScore.toString())
  }

  // Update global best score if higher
  const isGlobalPB = setBestScore(numScore, gameId)

  // Check for progression unlocks
  let newlyUnlockedTier = null
  const currentUnlocked = getUnlockedTiers(gameId)
  const tierIndex = DIFFICULTY_ORDER.indexOf(tierId)

  if (tierIndex >= 0 && tierIndex < DIFFICULTY_ORDER.length - 1) {
    const nextTier = DIFFICULTY_ORDER[tierIndex + 1]
    if (!currentUnlocked.includes(nextTier)) {
      const thresholdConfig = GAME_UNLOCK_THRESHOLDS[gameId]?.[nextTier]
      if (thresholdConfig && numScore >= thresholdConfig.score) {
        unlockTier(gameId, nextTier)
        newlyUnlockedTier = nextTier
      }
    }
  }

  return {
    isTierPB,
    isGlobalPB,
    newlyUnlockedTier,
    prevTierBest,
    currentScore: numScore,
  }
}

export const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 3000]

/**
 * Calculates level, current level xp, next level xp and progress percentage
 */
export function calculateProgression(totalXp) {
  const safeXp = Math.max(0, Math.round(Number(totalXp) || 0))
  let level = 1
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (safeXp >= XP_THRESHOLDS[i]) {
      level = i + 1
    } else {
      break
    }
  }
  if (level === XP_THRESHOLDS.length && safeXp >= XP_THRESHOLDS[XP_THRESHOLDS.length - 1]) {
    level += Math.floor((safeXp - XP_THRESHOLDS[XP_THRESHOLDS.length - 1]) / 500)
  }

  let currentThreshold, nextThreshold
  if (level < XP_THRESHOLDS.length) {
    currentThreshold = XP_THRESHOLDS[level - 1]
    nextThreshold = XP_THRESHOLDS[level]
  } else {
    currentThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + (level - XP_THRESHOLDS.length) * 500
    nextThreshold = currentThreshold + 500
  }

  const progressXp = Math.max(0, safeXp - currentThreshold)
  const progressRequired = Math.max(1, nextThreshold - currentThreshold)

  return {
    level,
    total_xp: safeXp,
    current_level_xp: currentThreshold,
    next_level_xp: nextThreshold,
    progress_xp: progressXp,
    progress_required: progressRequired,
  }
}

