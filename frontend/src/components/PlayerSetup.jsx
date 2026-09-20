import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, School, ArrowRight } from 'lucide-react'
import Button from './Button'

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

export default function PlayerSetup({ onSubmit }) {
  const [name, setName] = useState('')
  const [campus, setCampus] = useState('')
  const [customCampus, setCustomCampus] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      newErrors.name = 'Name must be 2-20 characters'
    }
    if (!campus) {
      newErrors.campus = 'Please select a campus'
    }
    if (campus === 'Other (type below)' && customCampus.trim().length < 2) {
      newErrors.campus = 'Please enter your campus name'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')
      const response = await fetch(`${apiUrl}/api/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim(), campus: finalCampus }),
      })
      const data = await response.json()
      if (response.ok) {
        onSubmit?.(data)
      } else {
        setErrors({ submit: data.error || 'Failed to create player' })
      }
    } catch (err) {
      // Offline fallback: allow player creation locally so games can be played immediately
      const localId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const localData = {
        player_id: localId,
        display_name: name.trim(),
        campus: finalCampus,
        avatar: '🪷',
        level: 1,
        xp: 0,
        universal_points: 0,
        created_at: new Date().toISOString(),
      }
      localStorage.setItem('ganpati_player', JSON.stringify(localData))
      onSubmit?.(localData)
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
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🪔</div>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Join the Blitz</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Enter your details to start playing
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={14} />
            Display Name
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your display name"
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

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <School size={14} />
            Campus
          </label>
          <select
            className="form-select"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
          >
            <option value="">Select your campus</option>
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>{c}</option>
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading}
          icon={loading ? null : <ArrowRight size={18} />}
        >
          {loading ? 'Joining...' : 'Join the Game'}
        </Button>
      </form>
    </motion.div>
  )
}
