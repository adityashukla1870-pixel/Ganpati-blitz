import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import PlayerSetup from '../components/PlayerSetup'

export default function PlayerSetupPage({ onSetup }) {
  const navigate = useNavigate()

  const handleSetup = (playerData) => {
    onSetup?.(playerData)
    navigate('/')
  }

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '480px' }}
      >
        <PlayerSetup onSubmit={handleSetup} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(27, 153, 139, 0.1)',
            border: '1px solid rgba(27, 153, 139, 0.2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Only your display name and campus are stored. No passwords collected.
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}
