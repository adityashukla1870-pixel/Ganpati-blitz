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
