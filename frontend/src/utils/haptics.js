/**
 * Tactile Haptic Vibration & Audio Juice Utilities for Ganpati Blitz
 */

// Safe Haptic feedback handler (works on Android Chrome, Samsung Internet, etc.)
export function triggerHaptic(pattern = 'light') {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
  if (!('vibrate' in navigator)) return

  try {
    switch (pattern) {
      case 'light': // Regular tap / modak collect
        navigator.vibrate(12)
        break
      case 'medium': // Silver fast modak / 3x combo
        navigator.vibrate(25)
        break
      case 'success': // Golden modak / 10x combo / victory
        navigator.vibrate([20, 35, 30])
        break
      case 'warning': // Decoy / burnt modak
        navigator.vibrate([35, 30, 20])
        break
      case 'danger': // Danger skull / hazard hit
        navigator.vibrate([50, 50, 65])
        break
      default:
        navigator.vibrate(15)
        break
    }
  } catch (_) {
    // Ignore any browser restrictions
  }
}

// Lightweight Web Audio sound synthesizer for crunchy, pitch-scaling taps
let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (AudioCtx) {
      audioCtx = new AudioCtx()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Play a juicy synthesized arcade chime that scales in pitch with the combo!
 * combo: number (0 to 15+)
 * type: 'classic' | 'golden' | 'silver' | 'kesar' | 'danger' | 'decoy'
 */
export function playJuicyAudio(combo = 0, type = 'classic', soundEnabled = true) {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime

    if (type === 'danger' || type === 'decoy' || type === 'burnt') {
      // Low buzz / hazard sound
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.22)

      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.22)
      return
    }

    // Musical scale frequencies (Indian Bilaval / Major pentatonic scale notes for divine feeling)
    const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0]
    const noteIndex = Math.min(combo, baseFreqs.length - 1)
    let freq = baseFreqs[noteIndex]

    if (type === 'golden' || type === 'kesar') {
      freq *= 1.25 // Higher sparkling pitch
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type === 'golden' ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + 0.08)

    const volume = type === 'golden' ? 0.25 : 0.18
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.16)
  } catch (_) {
    // Ignore audio failures
  }
}
