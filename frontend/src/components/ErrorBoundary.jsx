import React from 'react'
import { RotateCcw, Home, AlertTriangle, Clock, Play } from 'lucide-react'
import { createGuestPlayerIfMissing } from '../utils/useServerHealth'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, countdown: 60 }
    this.timer = null
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo)
    this.startCountdown()
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  startCountdown = () => {
    if (this.timer) clearInterval(this.timer)
    this.setState({ countdown: 60 })
    this.timer = setInterval(() => {
      this.setState((prev) => {
        if (prev.countdown <= 1) {
          clearInterval(this.timer)
          return { countdown: 0 }
        }
        return { countdown: prev.countdown - 1 }
      })
    }, 1000)
  }

  handleReload = () => {
    window.location.reload()
  }

  handlePlayGuest = () => {
    createGuestPlayerIfMissing()
    window.location.href = '/games'
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.href = '/games'
    }
  }

  render() {
    if (this.state.hasError) {
      const { countdown } = this.state
      return (
        <div
          style={{
            minHeight: '65vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: '100%',
              background: 'linear-gradient(180deg, rgba(28, 14, 44, 0.98) 0%, rgba(18, 8, 28, 0.98) 100%)',
              border: '1.5px solid var(--festival-gold, #FFD700)',
              borderRadius: 'var(--radius-xl, 20px)',
              padding: '2rem 1.75rem',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'rgba(255, 107, 53, 0.2)',
                border: '1.5px solid #FF6B35',
                color: '#FFD166',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text, #FFF)' }}>
              Server Waking Up or Game Interrupted
            </h3>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>
              Render free tier backend instances sleep during inactivity and take <strong>~50–60 seconds</strong> to spin up from cold start.
            </p>

            {/* Countdown Badge */}
            <div
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'rgba(255, 209, 102, 0.08)',
                border: '1px solid rgba(255, 209, 102, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#FFD166',
                fontSize: '0.88rem',
                fontWeight: 700,
              }}
            >
              <Clock size={16} />
              <span>
                {countdown > 0 ? `Try reloading in ~${countdown} seconds` : 'Ready to retry now!'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 6 }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: 'linear-gradient(135deg, #FF6B35, #FFD700)',
                  border: 'none',
                  color: '#1a0800',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
                }}
              >
                <RotateCcw size={16} /> Reload Game Now
              </button>

              <button
                type="button"
                onClick={this.handlePlayGuest}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Play size={15} /> Play Offline as Guest (Instant)
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = '/' }}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted, #9CA3AF)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Home size={15} /> Back to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
