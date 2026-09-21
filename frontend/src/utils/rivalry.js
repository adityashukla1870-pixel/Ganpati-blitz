/**
 * Retention & Rivalry Utilities for Ganpati Blitz
 * Powers near-miss psychology and Next Leaderboard Rival chases.
 */

/**
 * Calculates near-miss personal best progress
 */
export function getNearMissInfo(score, previousBest) {
  const current = Math.max(0, Number(score) || 0)
  const best = Math.max(0, Number(previousBest) || 0)

  if (best === 0) {
    return {
      isFirstRun: true,
      pct: 100,
      diff: 0,
      isNewPB: true,
      message: 'Great inaugural run! Benchmark set!',
    }
  }

  if (current >= best) {
    const margin = current - best
    return {
      isNewPB: true,
      margin,
      pct: 100,
      diff: 0,
      message: margin > 0 ? `🔥 NEW RECORD! Smashed previous best by +${margin} pts!` : 'Tied with your all-time High Score!',
    }
  }

  const diff = best - current
  const pct = Math.min(99, Math.round((current / best) * 100))
  const isNearMiss = pct >= 75 // Within 25% of PB

  let message = ''
  if (diff <= 25) {
    message = `⚡ SO CLOSE! Just ${diff} points away from your Personal Best (${best})!`
  } else if (isNearMiss) {
    message = `Almost there! You reached ${pct}% of your High Score (${best})!`
  } else {
    message = `Good effort! Your current High Score to beat is ${best}.`
  }

  return {
    isNewPB: false,
    isNearMiss,
    diff,
    pct,
    previousBest: best,
    message,
  }
}

/**
 * Finds the immediate next rival on the leaderboard to overtake
 */
export function getNextRivalTarget(currentPlayerId, playerUP = 0) {
  if (typeof localStorage === 'undefined') return null

  try {
    const raw = localStorage.getItem('ganpati_real_leaderboard_v2_All Campuses')
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const list = parsed.leaderboard || []
    if (!Array.isArray(list) || list.length === 0) return null

    // 1. If player is in the leaderboard
    const myIndex = list.findIndex(
      (e) => e.player_id === currentPlayerId || (e.id && e.id === currentPlayerId)
    )

    if (myIndex > 0) {
      // Rival is the player immediately 1 spot above
      const rival = list[myIndex - 1]
      const rivalUP = rival.universal_points ?? rival.score ?? 0
      const currentUP = list[myIndex].universal_points ?? playerUP
      const upGap = Math.max(1, rivalUP - currentUP)

      return {
        rivalName: rival.display_name || rival.name || 'Contender',
        rivalAvatar: rival.avatar || 'shree-ganesha',
        rivalRank: rival.rank || myIndex,
        rivalUP,
        upGap,
        message: `Only ${upGap} UP behind ${rival.display_name} (#${rival.rank || myIndex})! One more run to overtake!`,
      }
    }

    // 2. If player is not in top list, find lowest player above playerUP
    const candidates = list
      .filter((e) => (e.universal_points ?? 0) > playerUP)
      .sort((a, b) => (a.universal_points ?? 0) - (b.universal_points ?? 0))

    if (candidates.length > 0) {
      const rival = candidates[0]
      const rivalUP = rival.universal_points ?? 0
      const upGap = Math.max(1, rivalUP - playerUP)
      return {
        rivalName: rival.display_name || rival.name || 'Contender',
        rivalAvatar: rival.avatar || 'shree-ganesha',
        rivalRank: rival.rank || 'Board',
        rivalUP,
        upGap,
        message: `Only ${upGap} UP needed to catch ${rival.display_name} (#${rival.rank})!`,
      }
    }

    // 3. If player is top #1 or tied
    if (myIndex === 0) {
      return {
        isChampion: true,
        message: '👑 You hold the #1 Crown! Defend your rank against challengers!',
      }
    }
  } catch (_) {
    // Ignore cache parse errors
  }

  return null
}
