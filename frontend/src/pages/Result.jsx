import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import ResultCard from '../components/ResultCard'
import { submitScore } from '../services/api'
import { setBestScore, setUniversalPoints } from '../utils/storage'

export default function Result({ player }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [submissionStatus, setSubmissionStatus] = useState('idle')

  const state = location.state

  useEffect(() => {
    if (!state) {
      navigate('/')
      return
    }

    if (state.score) {
      setBestScore(state.score, 'modak-rush')
    }
  }, [state, navigate])

  useEffect(() => {
    if (!state || !player) return

    const submit = async () => {
      setSubmissionStatus('submitting')
      try {
        const res = await submitScore(player.player_id, state.score, state.duration, {
          game_id: 'modak-rush',
          stats: state.stats,
          maxCombo: state.maxCombo,
        })
        if (res?.new_universal_points !== undefined) {
          setUniversalPoints(res.new_universal_points)
        }
        setSubmissionStatus('success')
      } catch (err) {
        setSubmissionStatus('error')
      }
    }

    submit()
  }, [state, player])

  if (!state) return null

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <ResultCard
        score={state.score}
        isPersonalBest={state.isPersonalBest}
        previousBest={state.previousBest}
        gameStats={state.stats}
      />

      {submissionStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'rgba(255, 68, 68, 0.12)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            maxWidth: '500px',
          }}
        >
          <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
            Score could not be submitted. Please try again.
          </span>
        </motion.div>
      )}

      {submissionStatus === 'submitting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
        >
          Submitting score...
        </motion.div>
      )}
    </div>
  )
}
