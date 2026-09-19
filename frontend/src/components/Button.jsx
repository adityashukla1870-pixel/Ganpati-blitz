import { motion } from 'framer-motion'

const variantStyles = {
  play: {
    background: 'linear-gradient(135deg, var(--festival-ember, #ff5e3a) 0%, var(--festival-saffron, #ff9933) 55%, var(--festival-gold, #ffd166) 100%)',
    color: '#2a0f00',
    border: '2px solid var(--festival-gold, #ffd166)',
    boxShadow: '0 6px 24px rgba(255, 94, 58, 0.45), 0 0 30px rgba(255, 209, 102, 0.25)',
  },
  primary: {
    background: 'linear-gradient(135deg, var(--primary), #ff8c42)',
    color: '#fff',
    border: '2px solid var(--primary)',
    boxShadow: '0 4px 15px var(--shadow-primary)',
  },
  secondary: {
    background: 'transparent',
    color: '#fff',
    border: '2px solid var(--text-muted)',
    boxShadow: 'none',
  },
  gold: {
    background: 'linear-gradient(135deg, var(--secondary), #ffed4a)',
    color: 'var(--dark)',
    border: '2px solid var(--secondary)',
    boxShadow: '0 4px 15px var(--shadow-gold)',
  },
  danger: {
    background: 'linear-gradient(135deg, var(--danger), #ff6666)',
    color: '#fff',
    border: '2px solid var(--danger)',
    boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)',
  },
  accent: {
    background: 'linear-gradient(135deg, var(--accent), #20b2aa)',
    color: '#fff',
    border: '2px solid var(--accent)',
    boxShadow: '0 4px 15px rgba(27, 153, 139, 0.3)',
  },
}

const sizeStyles = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' },
  md: { padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)' },
  lg: { padding: '1rem 2rem', fontSize: '1.125rem', borderRadius: 'var(--radius-xl)' },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
  fullWidth = false,
  ...rest
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.04, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`btn ${variant === 'play' ? 'btn-play' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'box-shadow 0.3s ease',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : 'auto',
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </motion.button>
  )
}
