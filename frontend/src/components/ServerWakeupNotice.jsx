import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, RefreshCw, Zap, CheckCircle2, Play, AlertCircle, Server } from 'lucide-react'
import { useServerHealth } from '../utils/useServerHealth'
import { useNavigate } from 'react-router-dom'

/**
 * Top floating bar that informs user when Render free tier backend is waking up
 */
export function ServerWakeupBanner() {
  const { isWakingUp, isOnline, countdown, retryNow } = useServerHealth()
  const [dismissed, setDismissed] = useState(false)
  const [showOnlineFlash, setShowOnlineFlash] = useState(false)

  useEffect(() => {
    if (isOnline) {
      setShowOnlineFlash(true)
      const timer = setTimeout(() => setShowOnlineFlash(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (dismissed && !showOnlineFlash) return null

  return (
    <AnimatePresence>
      {(isWakingUp || showOnlineFlash) && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: '72px',
            left: 0,
            right: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 1rem',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              background: showOnlineFlash
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95))'
                : 'linear-gradient(135deg, rgba(30, 15, 50, 0.96), rgba(45, 15, 25, 0.96))',
              border: `1.5px solid ${showOnlineFlash ? '#4ADE80' : '#FFD166'}`,
              borderRadius: '9999px',
              padding: '0.45rem 1.1rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#FFF',
              maxWidth: '650px',
            }}
          >
            {showOnlineFlash ? (
              <>
                <CheckCircle2 size={16} color="#FFF" />
                <span>Backend Server is Online & Ready! 🎉</span>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFD166' }}>
                  <Clock size={15} className="animate-spin-slow" />
                  <span>Render Server Waking Up ({countdown}s)</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                  • Solo games work immediately
                </span>
                <button
                  type="button"
                  onClick={retryNow}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '9999px',
                    padding: '0.2rem 0.6rem',
                    color: '#FFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <RefreshCw size={12} /> Check
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Fullscreen or in-place modal when an action requires the backend
 * and server is currently sleeping
 */
export function ServerWakeupModal({ onDismiss, gameId = null, autoProceed = true }) {
  const { countdown, isOnline, retryNow, playAsGuest } = useServerHealth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOnline && autoProceed && onDismiss) {
      const t = setTimeout(() => onDismiss(), 1000)
      return () => clearTimeout(t)
    }
  }, [isOnline, autoProceed, onDismiss])

  const handleInstantGuest = () => {
    playAsGuest()
    if (gameId) {
      navigate(`/game/${gameId}`)
    } else {
      navigate('/games')
    }
    onDismiss?.()
  }

  const progressPercent = Math.max(0, Math.min(100, Math.round(((60 - countdown) / 60) * 100)))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(10, 5, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'linear-gradient(180deg, rgba(30, 15, 45, 0.98) 0%, rgba(18, 8, 28, 0.98) 100%)',
          border: '1.5px solid rgba(255, 209, 102, 0.35)',
          borderRadius: 'var(--radius-xl, 22px)',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 107, 53, 0.15)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.2rem',
          color: '#FFF',
        }}
      >
        {/* Animated Icon */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: isOnline
              ? 'rgba(34, 197, 94, 0.15)'
              : 'radial-gradient(circle, rgba(255, 209, 102, 0.25) 0%, rgba(255, 107, 53, 0.1) 100%)',
            border: `2px solid ${isOnline ? '#22C55E' : '#FFD166'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 25px ${isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 209, 102, 0.25)'}`,
          }}
        >
          {isOnline ? (
            <CheckCircle2 size={36} color="#22C55E" />
          ) : (
            <Server size={34} color="#FFD166" />
          )}
        </div>

        {/* Title & Explanation */}
        <div>
          <h2
            style={{
              margin: '0 0 0.4rem',
              fontSize: '1.35rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display, Poppins, sans-serif)',
              color: isOnline ? '#4ADE80' : '#FFF',
            }}
          >
            {isOnline ? 'Server is Ready! 🚀' : 'Server is Waking Up...'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
            {isOnline
              ? 'Connecting you to the game server now...'
              : 'Render free tier instances go to sleep when inactive. Waking up from cold sleep takes around 50–60 seconds.'}
          </p>
        </div>

        {/* Countdown & Progress Meter */}
        {!isOnline && (
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#FFD166', fontWeight: 800 }}>
                Estimated Wait Time
              </span>
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FFF' }}>
                ~{countdown}s remaining
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
                  borderRadius: '9999px',
                }}
              />
            </div>

            <p style={{ margin: '0.6rem 0 0', fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)' }}>
              Auto-checking every 4 seconds • No need to refresh page
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
          {/* Instant Guest Play Button */}
          <button
            type="button"
            onClick={handleInstantGuest}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md, 12px)',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FFD166 100%)',
              border: 'none',
              color: '#1A0800',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(255, 107, 53, 0.35)',
            }}
          >
            <Play size={17} /> Play Offline as Guest (No Wait!)
          </button>

          {/* Retry Button */}
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button
              type="button"
              onClick={retryNow}
              style={{
                flex: 1,
                padding: '0.65rem 0.8rem',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <RefreshCw size={14} /> Retry Now
            </button>

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
