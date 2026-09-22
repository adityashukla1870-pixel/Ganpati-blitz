import axios from 'axios'
import { setUniversalPoints, getPlayer, setPlayer } from '../utils/storage'
import { triggerServerWakingUp, markServerOnline } from '../utils/useServerHealth'

const defaultApiUrl = import.meta.env.PROD
  ? 'https://ganpati-blitz.onrender.com'
  : 'http://localhost:5000'

let rawApiUrl = import.meta.env.VITE_API_URL || defaultApiUrl
if (rawApiUrl.includes('ganpati-blitz-backend.onrender.com')) {
  rawApiUrl = 'https://ganpati-blitz.onrender.com'
}
export const API_URL = rawApiUrl.replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => {
    markServerOnline()
    return res
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    const isNetworkOrTimeout =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error') ||
      [502, 503, 504].includes(error.response?.status)

    if (isNetworkOrTimeout) {
      triggerServerWakingUp()
    }
    return Promise.reject(error)
  }
)

export const createPlayer = async (displayName, campus, avatar = 'shree-ganesha', pin = '') => {
  const res = await api.post('/api/player', { display_name: displayName, campus, avatar, pin })
  return res.data
}

export const loginPlayer = async (displayName, campus = null, pin = '') => {
  const res = await api.post('/api/player/login', { display_name: displayName, campus, pin })
  return res.data
}

export const submitScore = async (playerId, score, duration, gameData = {}) => {
  const gameId = gameData.game_id || 'modak-rush'
  const runId = gameData.run_id || gameData.session_id || `${playerId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const res = await api.post(`/api/games/${gameId}/score`, {
    player_id: playerId,
    score,
    duration,
    session_id: runId,
    run_id: runId,
    game_id: gameId,
    difficulty: gameData.difficulty || 'normal',
    stats: gameData.stats || gameData,
    game_data: gameData,
  })

  if (res?.data) {
    if (res.data.new_universal_points !== undefined) {
      setUniversalPoints(res.data.new_universal_points)
    }
    if (res.data.progression) {
      const p = getPlayer()
      if (p) {
        p.progression = res.data.progression
        p.level = res.data.progression.level
        p.total_xp = res.data.progression.total_xp
        setPlayer(p)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ganpati_player_updated', { detail: { player: p } }))
        }
      }
    }
  }

  return res.data
}

export const getPersonalBest = async (playerId, gameId = 'modak-rush') => {
  const res = await api.get(`/api/games/${gameId}/best/${playerId}`)
  return res.data
}

export const getGlobalLeaderboard = async (campus = null, limit = 50, page = 1, playerId = null) => {
  let url = `/api/leaderboard/global?limit=${limit}&page=${page}`
  if (campus && campus !== 'All Campuses') url += `&campus=${encodeURIComponent(campus)}`
  if (playerId) url += `&player_id=${encodeURIComponent(playerId)}`
  const res = await api.get(url)
  return res.data
}

export const getLeaderboard = async (campus = null, limit = 50, gameId = null) => {
  // If no gameId or explicitly looking for global ranks, use Global Universal Leaderboard
  return getGlobalLeaderboard(campus, limit, 1)
}

export const healthCheck = async () => {
  const res = await api.get('/api/health')
  return res.data
}

export const getProfile = async (playerId) => {
  const res = await api.get(`/api/profile/${playerId}`)
  return res.data
}

export const updatePlayerAvatar = async (playerId, avatar) => {
  const res = await api.post(`/api/player/${playerId}/avatar`, { avatar })
  return res.data
}

export const getProgression = async (playerId) => {
  const res = await api.get(`/api/progression/${playerId}`)
  return res.data
}

export const getPlayerAchievements = async (playerId) => {
  const res = await api.get(`/api/achievements/${playerId}`)
  return res.data
}

export const getDailyChallenge = async (playerId) => {
  const res = await api.get(`/api/daily-challenge?player_id=${encodeURIComponent(playerId || '')}`)
  return res.data
}

export const getStats = async (playerId) => {
  const res = await api.get(`/api/stats/${playerId}`)
  return res.data
}

export const completeDailyChallenge = async (playerId) => {
  const res = await api.post('/api/daily-challenge/complete', { player_id: playerId })
  return res.data
}

export const getMatchHistory = async (playerId) => {
  const res = await api.get(`/api/matches/history/${playerId}`)
  return res.data
}

export const getMultiplayerLeaderboard = async () => {
  const res = await api.get('/api/leaderboard/multiplayer')
  return res.data
}

export default api
