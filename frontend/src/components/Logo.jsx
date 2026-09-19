import { motion } from 'framer-motion'
import { useId } from 'react'

const LOGO_URL = '/logo.png'

export function Logo({
  variant = 'full',
  size = 120,
  maxWidth = '100%',
  className = '',
  animate = true,
  style = {},
}) {
  const horizontal = variant === 'horizontal'
  const square = variant === 'square'
  const icon = variant === 'icon'
  const mono = variant === 'mono'
  const full = variant === 'full'

  const w = horizontal ? Math.round(size * 3.2) : full ? Math.round(size * 1.2) : size
  const h = size

  const patternId = useId()
  const rx = icon ? Math.max(6, Math.round(size * 0.25)) : square ? Math.max(8, Math.round(size * 0.22)) : Math.round(h * 0.16)

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="Ganpati Blitz"
      style={{
        display: 'block',
        maxWidth: maxWidth || '100%',
        width: `${w}px`,
        height: `${h}px`,
        flexShrink: 0,
        ...style,
      }}
    >
      <defs>
        {!mono && (
          <>
            <linearGradient id={`goldGradient-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD166" />
              <stop offset="50%" stopColor="#FFB800" />
              <stop offset="100%" stopColor="#E0A83A" />
            </linearGradient>
            <linearGradient id={`saffronGradient-${patternId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9933" />
              <stop offset="50%" stopColor="#FF5E3A" />
              <stop offset="100%" stopColor="#FF9933" />
            </linearGradient>
            <filter id={`glow-${patternId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        )}

        {mono && (
          <linearGradient id={`monoGradient-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#ccc" />
          </linearGradient>
        )}

        <clipPath id={`logoClip-${patternId}`}>
          <rect
            x={horizontal ? 0 : 0}
            y={0}
            width={horizontal ? size : w}
            height={h}
            rx={rx}
            ry={rx}
          />
        </clipPath>
      </defs>

      {/* Background container with image */}
      <g filter={mono ? undefined : `url(#glow-${patternId})`}>
        {/* Dark backing to ensure image blend */}
        <rect
          x={0}
          y={0}
          width={horizontal ? size : w}
          height={h}
          rx={rx}
          ry={rx}
          fill="#0c081c"
        />

        {/* Logo artwork clipped cleanly to frame */}
        <g clipPath={`url(#logoClip-${patternId})`}>
          <image
            href={LOGO_URL}
            x={horizontal ? 0 : 0}
            y={0}
            width={horizontal ? size : w}
            height={h}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>

        {/* Outer decorative border */}
        <rect
          x={1}
          y={1}
          width={(horizontal ? size : w) - 2}
          height={h - 2}
          rx={rx - 1}
          ry={rx - 1}
          fill="none"
          stroke={mono ? '#fff' : 'rgba(255, 209, 102, 0.45)'}
          strokeWidth={1.5}
        />

        {/* Inner subtle accent border */}
        {size >= 64 && (
          <rect
            x={4}
            y={4}
            width={(horizontal ? size : w) - 8}
            height={h - 8}
            rx={Math.max(4, rx - 3)}
            ry={Math.max(4, rx - 3)}
            fill="none"
            stroke={mono ? '#fff' : '#FFD166'}
            strokeWidth={1}
            opacity={0.3}
            strokeDasharray="6 4"
          />
        )}
      </g>

      {/* Horizontal Wordmark only for horizontal banner variant */}
      {horizontal && (
        <g transform={`translate(${size + 14}, 0)`}>
          <Wordmark
            width={w - size - 20}
            height={h}
            mono={mono}
            animate={animate}
            patternId={patternId}
          />
        </g>
      )}
    </svg>
  )
}

function Lotus({ x, y, size }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${size / 24})`}>
      <ellipse cx={0} cy={-6} rx={10} ry={12} fill="rgba(255,209,102,0.35)" />
      <ellipse cx={-9} cy={4} rx={9} ry={11} fill="rgba(255,209,102,0.25)" transform="rotate(-35)" />
      <ellipse cx={9} cy={4} rx={9} ry={11} fill="rgba(255,209,102,0.25)" transform="rotate(35)" />
      <circle cx={0} cy={0} r={4} fill="#FFD166" />
    </g>
  )
}

function Wordmark({ width, height, mono, animate, patternId }) {
  const centerX = width / 2
  const centerY = height / 2
  const goldGrad = `url(#goldGradient-${patternId})`
  const saffronGrad = `url(#saffronGradient-${patternId})`
  const monoGrad = `url(#monoGradient-${patternId})`
  const lightningGrad = `url(#lightningGradient-${patternId})`

  return (
    <g>
      <motion.text
        x={centerX}
        y={centerY - 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={height * 0.15}
        fontWeight="900"
        fontFamily="'Baloo 2', cursive"
        fill={mono ? monoGrad : goldGrad}
        letterSpacing="0.04em"
        initial={{ opacity: 0, y: 10 }}
        animate={animate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
        style={{ filter: mono ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        GANPATI
      </motion.text>

      <motion.text
        x={centerX}
        y={centerY + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={height * 0.13}
        fontWeight="800"
        fontFamily="'Baloo 2', cursive"
        fill={mono ? monoGrad : saffronGrad}
        letterSpacing="0.08em"
        transform={`skewX(-10)`}
        initial={{ opacity: 0, x: -10 }}
        animate={animate ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
        style={{
          filter: mono ? 'none' : 'drop-shadow(0 2px 8px rgba(255,94,58,0.4))',
          paintOrder: 'stroke fill',
          stroke: mono ? 'none' : 'rgba(255,94,58,0.3)',
          strokeWidth: 0.5,
        }}
      >
        BLITZ
      </motion.text>

      {!mono && (
        <motion.path
          d={`M ${centerX - width * 0.18} ${centerY + 28} L ${centerX - width * 0.1} ${centerY + 42} L ${centerX - width * 0.14} ${centerY + 42} L ${centerX} ${centerY + 56} L ${centerX - width * 0.06} ${centerY + 42} L ${centerX - width * 0.1} ${centerY + 42} Z`}
          fill={lightningGrad}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={animate ? { opacity: 1, scaleX: 1 } : { opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
          transformOrigin={`${centerX} ${centerY + 42}`}
        />
      )}
    </g>
  )
}

export const LogoFull = (props) => <Logo variant="full" {...props} />
export const LogoHorizontal = (props) => <Logo variant="horizontal" {...props} />
export const LogoSquare = (props) => <Logo variant="square" {...props} />
export const LogoIcon = (props) => <Logo variant="icon" {...props} />
export const LogoMono = (props) => <Logo variant="mono" {...props} />

export default Logo