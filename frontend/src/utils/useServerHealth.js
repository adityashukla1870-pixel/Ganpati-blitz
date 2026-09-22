import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '../services/api'
import { getPlayer, setPlayer } from './storage'

// Singleton memory state to keep all components in sync
let globalServerState = {
  status: 'checking', // 'checking' | 'waking_up' | 'online' | 'error'
  countdown: 60,
  lastChecked: 0,
  pollTimer: null,
  countdownTimer: null,
}

const listeners = new Set()

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...globalServerState }))
}

function startCountdown() {
  if (globalServerState.countdownTimer) return
  globalServerState.countdown = 60

  globalServerState.countdownTimer = setInterval(() => {
    if (globalServerState.countdown > 0) {
      globalServerState.countdown -= 1
      notifyListeners()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ganpati_server_countdown', {
            detail: { countdown: globalServerState.countdown },
          })
        )
      }
    } else {
      clearInterval(globalServerState.countdownTimer)
      globalServerState.countdownTimer = null
    }
  }, 1000)
}

function stopCountdown() {
  if (globalServerState.countdownTimer) {
    clearInterval(globalServerState.countdownTimer)
    globalServerState.countdownTimer = null
  }
}

export const triggerServerWakingUp = (initialSeconds = 60) => {
  if (globalServerState.status === 'online') return
  globalServerState.status = 'waking_up'
  globalServerState.countdown = initialSeconds
  startCountdown()
  notifyListeners()

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ganpati_server_waking_up', {
        detail: { countdown: globalServerState.countdown },
      })
    )
  }

  // Ensure polling is active
  startPolling()
}

export const markServerOnline = () => {
  globalServerState.status = 'online'
  globalServerState.countdown = 0
  stopCountdown()
  if (globalServerState.pollTimer) {
    clearInterval(globalServerState.pollTimer)
    globalServerState.pollTimer = null
  }
  notifyListeners()

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ganpati_server_online'))
  }
}

export const checkServerHealth = async () => {
  globalServerState.lastChecked = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  try {
    const res = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      markServerOnline()
      return true
    } else {
      triggerServerWakingUp()
      return false
    }
  } catch (err) {
    clearTimeout(timeoutId)
    triggerServerWakingUp()
    return false
  }
}

function startPolling() {
  if (globalServerState.pollTimer || globalServerState.status === 'online') return

  globalServerState.pollTimer = setInterval(async () => {
    if (globalServerState.status === 'online') {
      clearInterval(globalServerState.pollTimer)
      globalServerState.pollTimer = null
      return
    }
    await checkServerHealth()
  }, 4000)
}

/**
 * Creates an instant guest player in localStorage so single-player games
 * are NEVER blocked by server sleeping!
 */
export const createGuestPlayerIfMissing = () => {
  const existing = getPlayer()
  if (existing && (existing.player_id || existing.id)) {
    return existing
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const guest = {
    player_id: `guest_${Date.now()}_${randomNum}`,
    id: `guest_${Date.now()}_${randomNum}`,
    display_name: `Blitzer #${randomNum}`,
    campus: 'Arcade Guest',
    avatar: 'shree-ganesha',
    universal_points: 0,
    is_guest: true,
  }

  setPlayer(guest)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ganpati_player_updated', { detail: { player: guest } }))
  }
  return guest
}

/**
 * React Hook for components to subscribe to server health state
 */
export function useServerHealth() {
  const [state, setState] = useState({ ...globalServerState })

  useEffect(() => {
    listeners.add(setState)
    // Trigger initial health check if not yet checked
    if (globalServerState.lastChecked === 0) {
      checkServerHealth()
    }
    return () => {
      listeners.delete(setState)
    }
  }, [])

  const retryNow = useCallback(() => {
    return checkServerHealth()
  }, [])

  const playAsGuest = useCallback(() => {
    return createGuestPlayerIfMissing()
  }, [])

  return {
    status: state.status,
    countdown: state.countdown,
    isWakingUp: state.status === 'waking_up',
    isOnline: state.status === 'online',
    isChecking: state.status === 'checking',
    retryNow,
    playAsGuest,
  }
}
