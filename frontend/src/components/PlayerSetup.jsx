import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, School, ArrowRight, LogIn, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react'
import Button from './Button'
import { createPlayer, loginPlayer } from '../services/api'

const CAMPUSES = [
  'NIAT Jaipur',
  'NIAT Delhi',
  'NIAT Pune',
  'NIAT Bangalore',
  'NIAT Hyderabad',
  'NIAT Chennai',
  'NIAT Mumbai',
  'Other (type below)',
]

const AVATARS = ['🪷', '🥟', '🪔', '🥁', '🐭', '🎨', '⚡', '🧠']

export default function PlayerSetup({ onSubmit, defaultMode = 'create' }) {
  const [mode, setMode] = useState(defaultMode) // 'create' | 'login'
  const [name, setName] = useState('')
  const [campus, setCampus] = useState('NIAT Jaipur')
  const [customCampus, setCustomCampus] = useState('')
  const [avatar, setAvatar] = useState('🪷')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const getFinalCampus = () => {
    if (campus === 'Other (type below)') {
      return customCampus.trim() || 'Other'
    }
    return campus
  }

  const validate = () => {
    const newErrors = {}
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      newErrors.name = 'Name must be 2-20 characters'
    }
    if (mode === 'create') {
      if (!campus) {
        newErrors.campus = 'Please select a campus'
      }
      if (campus === 'Other (type below)' && customCampus.trim().length < 2) {
        newErrors.campus = 'Please enter your campus name'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})
    setSuccessMsg('')
    const finalCampus = getFinalCampus()

    try {
      if (mode === 'login') {
        const data = await loginPlayer(name.trim(), campus === 'All Campuses' ? null : finalCampus)
        setSuccessMsg(`Welcome back, ${data.display_name}! Loading your stats...`)
        localStorage.setItem('ganpati_player', JSON.stringify(data))
        localStorage.setItem('ganpati_universal_points', String(data.universal_points || 0))
        setTimeout(() => {
          onSubmit?.(data)
        }, 500)
      } else {
        const data = await createPlayer(name.trim(), finalCampus, avatar)
        if (data.is_existing) {
          setSuccessMsg(`Existing account found for ${data.display_name}! Logged you in.`)
        }
        localStorage.setItem('ganpati_player', JSON.stringify(data))
        localStorage.setItem('ganpati_universal_points', String(data.universal_points || 0))
        setTimeout(() => {
          onSubmit?.(data)
        }, 500)
      }
    } catch (err) {
      const serverErr = err.response?.data?.error
      if (mode === 'login') {
        setErrors({
          submit: serverErr || `No account found for "${name.trim()}". Check spelling or click "Create Account".`,
        })
      } else {
        // Offline fallback for registration
        const localId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const localData = {
          player_id: localId,
          display_name: name.trim(),
          campus: finalCampus,
          avatar,
          level: 1,
          xp: 0,
          universal_points: 0,
          created_at: new Date().toISOString(),
        }
        localStorage.setItem('ganpati_player', JSON.stringify(localData))
        localStorage.setItem('ganpati_universal_points', '0')
        onSubmit?.(localData)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="card"
      style={{ maxWidth: '480px', width: '100%', margin: '0 auto', padding: '2rem' }}
    >
      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.4rem',
          padding: '0.3rem',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-lg, 12px)',
          marginBottom: '1.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setMode('create')
            setErrors({})
            setSuccessMsg('')
          }}
          style={{
            padding: '0.65rem 0.5rem',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            background: mode === 'create' ? 'linear-gradient(135deg, #FF6B35, #FFA834)' : 'transparent',
            color: mode === 'create' ? '#FFF' : 'var(--text-muted)',
            fontWeight: mode === 'create' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            transition: 'all 0.2s',
          }}
        >
          <UserPlus size={15} /> Create Account
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('login')
            setErrors({})
            setSuccessMsg('')
          }}
          style={{
            padding: '0.65rem 0.5rem',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            background: mode === 'login' ? 'linear-gradient(135deg, #FF6B35, #FFA834)' : 'transparent',
            color: mode === 'login' ? '#FFF' : 'var(--text-muted)',
            fontWeight: mode === 'login' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            transition: 'all 0.2s',
          }}
        >
          <LogIn size={15} /> Log In
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.4rem', marginBottom: '0.35rem' }}>
          {mode === 'create' ? avatar : '🪔'}
        </div>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.45rem', fontWeight: 800 }}>
          {mode === 'create' ? 'Create Player Profile' : 'Log In to Account'}
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
          {mode === 'create'
            ? 'Set up your player profile to climb the global leaderboard'
            : 'Enter your registered name to restore your points & rank'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Avatar picker (only in Create mode) */}
        {mode === 'create' && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
              Choose Your Sacred Avatar
            </label>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md, 8px)',
                    border: avatar === emoji ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                    background: avatar === emoji ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                    fontSize: '1.35rem',
                    cursor: 'pointer',
                    transform: avatar === emoji ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Display Name */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={14} />
            Display Name
          </label>
          <input
            type="text"
            className="form-input"
            placeholder={mode === 'create' ? 'e.g. Aditya Shukla' : 'Enter your registered name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          {errors.name && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}
            >
              {errors.name}
            </motion.span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            {name.length}/20 characters
          </span>
        </div>

        {/* Campus Selection */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <School size={14} />
            Campus {mode === 'login' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>}
          </label>
          <select
            className="form-select"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
          >
            {mode === 'login' && <option value="All Campuses">All Campuses (Auto-detect)</option>}
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.campus && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}
            >
              {errors.campus}
            </motion.span>
          )}
        </div>

        {/* Custom Campus input */}
        {campus === 'Other (type below)' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="form-group"
            style={{ marginBottom: 0 }}
          >
            <label className="form-label">Your Campus Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your campus name"
              value={customCampus}
              onChange={(e) => setCustomCampus(e.target.value)}
            />
          </motion.div>
        )}

        {/* Error message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            {errors.submit}
          </motion.div>
        )}

        {/* Success message */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success, #10B981)',
              fontSize: '0.85rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </motion.div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading}
          icon={loading ? null : mode === 'login' ? <LogIn size={18} /> : <ArrowRight size={18} />}
        >
          {loading ? 'Connecting...' : mode === 'login' ? 'Log In & Play' : 'Create Profile & Play'}
        </Button>
      </form>
    </motion.div>
  )
}
