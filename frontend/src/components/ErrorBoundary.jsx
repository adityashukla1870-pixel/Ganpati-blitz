import React from 'react'
import { RotateCcw, Home, AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo)
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
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              background: 'rgba(25, 12, 40, 0.95)',
              border: '1.5px solid var(--festival-gold, #FFD700)',
              borderRadius: 'var(--radius-xl, 18px)',
              padding: '2rem 1.5rem',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255, 107, 53, 0.2)',
                color: '#FF6B35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
              Something went unexpected
            </h3>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Your blitz progress has been saved locally. Tap below to return to the Arcade Hub or reload.
            </p>

            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  flex: 1,
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
                }}
              >
                <RotateCcw size={16} /> Return to Arcade
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = '/' }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--text)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Home size={16} /> Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
