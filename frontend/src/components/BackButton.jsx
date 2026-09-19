import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ to, label = 'Back', onClick, style = {} }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.45rem 0.95rem',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: 'var(--radius-full, 9999px)',
        color: 'var(--text, #EAEAEA)',
        fontSize: '0.85rem',
        fontWeight: 700,
        fontFamily: 'var(--font-sans, inherit)',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'background 0.2s, border-color 0.2s',
        ...style,
      }}
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </motion.button>
  )
}
