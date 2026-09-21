const PLAYER_KEY = 'ganpati_player'
const SOUND_KEY = 'ganpati_sound'

export const getPlayer = () => {
  const data = localStorage.getItem(PLAYER_KEY)
  return data ? JSON.parse(data) : null
}

export const setPlayer = (player) => {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
}

export const clearPlayer = () => {
  localStorage.removeItem(PLAYER_KEY)
  localStorage.removeItem('ganpati_universal_points')
}

export const getUniversalPoints = () => {
  const p = getPlayer()
  const localUP = parseInt(localStorage.getItem('ganpati_universal_points') || '0', 10)
  return Math.max(Number(p?.universal_points || 0), localUP)
}

export const setUniversalPoints = (points) => {
  const num = Math.max(0, Math.round(Number(points || 0)))
  localStorage.setItem('ganpati_universal_points', String(num))
  const p = getPlayer()
  if (p) {
    p.universal_points = num
    setPlayer(p)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ganpati_points_updated', { detail: { universal_points: num } }))
    if (p) {
      window.dispatchEvent(new CustomEvent('ganpati_player_updated', { detail: { player: p } }))
    }
  }
}

export const getBestScore = (gameId = 'modak-rush') => {
  const key = `ganpati_best_${gameId.replace(/-/g, '_')}`
  return parseInt(localStorage.getItem(key) || '0', 10)
}

export const setBestScore = (score, gameId = 'modak-rush') => {
  const key = `ganpati_best_${gameId.replace(/-/g, '_')}`
  const current = getBestScore(gameId)
  if (score > current) {
    localStorage.setItem(key, score.toString())
    return true
  }
  return false
}

export const getSoundEnabled = () => {
  return localStorage.getItem(SOUND_KEY) !== 'false'
}

export const setSoundEnabled = (enabled) => {
  localStorage.setItem(SOUND_KEY, enabled.toString())
}
