import React from 'react'
import { getAvatarMeta } from '../config/avatars'

/**
 * PlayerAvatar Component
 * Renders high-definition festive vector insignias with ornate borders and gradients.
 */
export default function PlayerAvatar({
  avatar,
  size = 40,
  showGlow = false,
  tierColor = null,
  style = {},
  className = '',
  title = null,
}) {
  const meta = getAvatarMeta(avatar)
  const finalBorderColor = tierColor || meta.borderColor || '#FFD700'
  const finalGlow = showGlow
    ? `0 0 16px ${meta.glow}, 0 2px 8px rgba(0,0,0,0.5)`
    : '0 2px 8px rgba(0,0,0,0.35)'

  return (
    <div
      className={`player-avatar-container ${className}`}
      title={title || meta.name}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        background: meta.bg,
        border: `2px solid ${finalBorderColor}`,
        boxShadow: finalGlow,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="82%"
        height="82%"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Shared Metallic Gold Gradients */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF275" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="45%" stopColor="#F97316" />
            <stop offset="85%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <linearGradient id="lotusPinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="60%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#BE185D" />
          </linearGradient>

          <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="60%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>

          <filter id="avatarDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Dynamic Vector Artwork per Insignia */}
        {renderInsigniaPath(meta.id)}
      </svg>
    </div>
  )
}

function renderInsigniaPath(id) {
  switch (id) {
    case 'shree-ganesha':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Radiant Halo */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          {/* Mukut / Crown */}
          <polygon points="50,8 38,28 62,28" fill="url(#goldGrad)" />
          <circle cx="50" cy="18" r="3" fill="#E11D48" />
          {/* Head & Ears */}
          <ellipse cx="28" cy="46" rx="14" ry="17" fill="url(#goldGrad)" opacity="0.9" />
          <ellipse cx="72" cy="46" rx="14" ry="17" fill="url(#goldGrad)" opacity="0.9" />
          <circle cx="50" cy="46" r="21" fill="url(#goldGrad)" />
          {/* Tilak */}
          <path d="M46,31 Q50,42 54,31 Z" fill="#DC2626" />
          <circle cx="50" cy="41" r="2.2" fill="#DC2626" />
          {/* Tusk & Trunk */}
          <path d="M50,54 Q50,78 63,75 Q69,72 65,65 Q62,60 56,64 Q54,68 53,74" fill="none" stroke="#FFF" strokeWidth="6.5" strokeLinecap="round" />
          <circle cx="64" cy="63" r="4.5" fill="#FBBF24" /> {/* Modak in trunk */}
          {/* Eyes */}
          <ellipse cx="42" cy="43" rx="3.5" ry="1.8" fill="#451A03" />
          <ellipse cx="58" cy="43" rx="3.5" ry="1.8" fill="#451A03" />
        </g>
      )

    case 'sacred-modak':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Steam / Aura wisps */}
          <path d="M46,12 Q44,4 49,2" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <path d="M54,14 Q56,6 51,3" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          {/* Modak Body */}
          <path
            d="M50,15 C54,25 78,55 78,72 C78,85 66,92 50,92 C34,92 22,85 22,72 C22,55 46,25 50,15 Z"
            fill="url(#goldGrad)"
            stroke="#B45309"
            strokeWidth="1.5"
          />
          {/* Pleats */}
          <path d="M50,16 Q45,55 33,88" fill="none" stroke="#B45309" strokeWidth="1.6" opacity="0.75" />
          <path d="M50,16 Q50,55 50,91" fill="none" stroke="#B45309" strokeWidth="1.6" opacity="0.75" />
          <path d="M50,16 Q55,55 67,88" fill="none" stroke="#B45309" strokeWidth="1.6" opacity="0.75" />
          {/* Saffron Strand & Cardamom */}
          <path d="M49,15 Q52,10 55,14" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
          <circle cx="44" cy="62" r="1.5" fill="#451A03" opacity="0.6" />
          <circle cx="58" cy="70" r="1.5" fill="#451A03" opacity="0.6" />
        </g>
      )

    case 'divine-diya':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Flame Halo Glow */}
          <circle cx="50" cy="30" r="22" fill="#FEF08A" opacity="0.25" />
          {/* Sacred Flame */}
          <path
            d="M50,6 C58,22 62,34 50,44 C38,34 42,22 50,6 Z"
            fill="url(#flameGrad)"
          />
          {/* Diya Lamp Base */}
          <path
            d="M14,56 C28,52 72,52 86,56 C88,68 76,82 50,82 C24,82 12,68 14,56 Z"
            fill="url(#goldGrad)"
            stroke="#9A3412"
            strokeWidth="1.5"
          />
          {/* Base Stem / Stand */}
          <path d="M40,81 L60,81 L65,92 L35,92 Z" fill="url(#goldGrad)" stroke="#9A3412" strokeWidth="1.2" />
          {/* Engraving */}
          <circle cx="50" cy="67" r="4" fill="#9A3412" opacity="0.6" />
        </g>
      )

    case 'sacred-padma':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Back Petals */}
          <path d="M50,12 C40,28 32,48 50,68 C68,48 60,28 50,12 Z" fill="url(#lotusPinkGrad)" opacity="0.85" />
          <path d="M22,32 C26,50 38,62 50,70 C36,64 22,50 22,32 Z" fill="url(#lotusPinkGrad)" opacity="0.7" />
          <path d="M78,32 C74,50 62,62 50,70 C64,64 78,50 78,32 Z" fill="url(#lotusPinkGrad)" opacity="0.7" />
          {/* Front Main Blooming Petals */}
          <path d="M50,26 C42,42 36,64 50,80 C64,64 58,42 50,26 Z" fill="url(#lotusPinkGrad)" stroke="#FFF" strokeWidth="1" />
          <path d="M12,50 C26,56 42,70 50,80 C36,78 20,68 12,50 Z" fill="url(#lotusPinkGrad)" stroke="#FFF" strokeWidth="0.8" />
          <path d="M88,50 C74,56 58,70 50,80 C64,78 80,68 88,50 Z" fill="url(#lotusPinkGrad)" stroke="#FFF" strokeWidth="0.8" />
          {/* Golden Pollen Pod */}
          <circle cx="50" cy="74" r="5.5" fill="url(#goldGrad)" />
        </g>
      )

    case 'royal-dhol':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Drum Body */}
          <ellipse cx="50" cy="50" rx="36" ry="24" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="2" transform="rotate(-15 50 50)" />
          {/* Left / Right Drumheads */}
          <ellipse cx="20" cy="42" rx="7" ry="18" fill="url(#goldGrad)" stroke="#451A03" strokeWidth="1.5" transform="rotate(-15 20 42)" />
          <ellipse cx="80" cy="58" rx="7" ry="18" fill="url(#goldGrad)" stroke="#451A03" strokeWidth="1.5" transform="rotate(-15 80 58)" />
          {/* Rope Lace zigzags */}
          <path d="M26,32 L48,42 L74,48 L52,58 L28,62 L50,72 L72,74" fill="none" stroke="#FDE68A" strokeWidth="2.2" strokeLinejoin="round" />
          {/* Beater Sticks */}
          <line x1="28" y1="12" x2="68" y2="88" stroke="url(#goldGrad)" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="72" y1="12" x2="32" y2="88" stroke="url(#goldGrad)" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )

    case 'mushak-vahana':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Ears */}
          <circle cx="28" cy="30" r="15" fill="#0284C7" stroke="url(#goldGrad)" strokeWidth="2" />
          <circle cx="28" cy="30" r="9" fill="#FDA4AF" />
          <circle cx="72" cy="30" r="15" fill="#0284C7" stroke="url(#goldGrad)" strokeWidth="2" />
          <circle cx="72" cy="30" r="9" fill="#FDA4AF" />
          {/* Head */}
          <ellipse cx="50" cy="54" rx="26" ry="24" fill="#E0F2FE" />
          {/* Crown */}
          <polygon points="50,14 42,28 58,28" fill="url(#goldGrad)" />
          {/* Eyes */}
          <ellipse cx="38" cy="48" rx="3.5" ry="5" fill="#0F172A" />
          <circle cx="39" cy="46" r="1.5" fill="#FFF" />
          <ellipse cx="62" cy="48" rx="3.5" ry="5" fill="#0F172A" />
          <circle cx="63" cy="46" r="1.5" fill="#FFF" />
          {/* Nose & Whiskers */}
          <polygon points="50,60 46,65 54,65" fill="#F43F5E" />
          <line x1="32" y1="62" x2="16" y2="60" stroke="#0369A1" strokeWidth="1.8" />
          <line x1="32" y1="65" x2="16" y2="68" stroke="#0369A1" strokeWidth="1.8" />
          <line x1="68" y1="62" x2="84" y2="60" stroke="#0369A1" strokeWidth="1.8" />
          <line x1="68" y1="65" x2="84" y2="68" stroke="#0369A1" strokeWidth="1.8" />
          {/* Golden Modak in Paws */}
          <ellipse cx="50" cy="80" rx="10" ry="11" fill="url(#goldGrad)" />
        </g>
      )

    case 'mandala-rangoli':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Outer Ring */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="#FDE047" strokeWidth="2" strokeDasharray="5 3" />
          {/* 8-Point Floral Mandala */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="50"
              cy="28"
              rx="9"
              ry="16"
              fill="url(#goldGrad)"
              stroke="#065F46"
              strokeWidth="1"
              transform={`rotate(${deg} 50 50)`}
              opacity="0.9"
            />
          ))}
          {/* Inner Petals */}
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => (
            <circle
              key={deg}
              cx="50"
              cy="34"
              r="4.5"
              fill="#F43F5E"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          {/* Center Hub */}
          <circle cx="50" cy="50" r="10" fill="#047857" stroke="#FFF" strokeWidth="2" />
          <circle cx="50" cy="50" r="4" fill="#FDE047" />
        </g>
      )

    case 'sudarshan-chakra':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Spinning Energy Aura */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="8 6" opacity="0.75" />
          {/* 12 Flaming Spikes */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <polygon
              key={deg}
              points="50,6 46,22 54,22"
              fill="url(#goldGrad)"
              stroke="#B45309"
              strokeWidth="0.8"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          {/* Outer Disc Rim */}
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#goldGrad)" strokeWidth="4" />
          {/* 6 Inner Spokes */}
          {[0, 60, 120].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="22"
              x2="50"
              y2="78"
              stroke="#FFF"
              strokeWidth="2.5"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          {/* Center Jewel */}
          <circle cx="50" cy="50" r="11" fill="url(#flameGrad)" stroke="#FFD700" strokeWidth="2" />
        </g>
      )

    case 'omkara-crest':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Celestial Back Radiance */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="#C084FC" strokeWidth="1.5" opacity="0.6" />
          {/* Calligraphic Om (ॐ) */}
          <text
            x="48"
            y="68"
            fontFamily="'Noto Sans', 'Segoe UI', 'Arial', sans-serif"
            fontSize="54"
            fontWeight="900"
            fill="url(#goldGrad)"
            stroke="#581C87"
            strokeWidth="1.5"
            textAnchor="middle"
          >
            ॐ
          </text>
        </g>
      )

    case 'rudra-trishul':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Shaft */}
          <line x1="50" y1="20" x2="50" y2="94" stroke="url(#goldGrad)" strokeWidth="5.5" strokeLinecap="round" />
          {/* Center Spearhead */}
          <polygon points="50,6 44,32 56,32" fill="url(#flameGrad)" stroke="#7C2D12" strokeWidth="1" />
          {/* Left & Right Crescent Blades */}
          <path
            d="M50,44 C30,44 24,18 24,14 C28,32 40,36 50,36 C60,36 72,32 76,14 C76,18 70,44 50,44 Z"
            fill="url(#goldGrad)"
            stroke="#7C2D12"
            strokeWidth="1.2"
          />
          {/* Miniature Damru in Center */}
          <polygon points="40,50 60,50 40,64 60,64" fill="#B91C1C" stroke="#FDE68A" strokeWidth="1.5" />
          <circle cx="50" cy="57" r="3" fill="url(#goldGrad)" />
          {/* Red sacred cord */}
          <line x1="42" y1="57" x2="26" y2="70" stroke="#DC2626" strokeWidth="1.8" />
          <circle cx="25" cy="71" r="2.5" fill="#FDE047" />
        </g>
      )

    case 'maharaja-crown':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Peacock Feather Plume */}
          <ellipse cx="50" cy="18" rx="7" ry="14" fill="#0D9488" />
          <ellipse cx="50" cy="18" rx="4" ry="8" fill="#1D4ED8" />
          <circle cx="50" cy="18" r="2.5" fill="url(#goldGrad)" />
          {/* Main Crown Body */}
          <path
            d="M18,72 L26,38 L38,54 L50,30 L62,54 L74,38 L82,72 Z"
            fill="url(#goldGrad)"
            stroke="#B45309"
            strokeWidth="1.8"
          />
          {/* Crown Base Band */}
          <rect x="16" y="72" width="68" height="14" rx="4" fill="#B45309" stroke="#FFD700" strokeWidth="1.5" />
          {/* Inlaid Gems */}
          <circle cx="28" cy="79" r="3.5" fill="#E11D48" />
          <circle cx="50" cy="79" r="4.5" fill="#10B981" />
          <circle cx="72" cy="79" r="3.5" fill="#E11D48" />
          {/* Peak Jewels */}
          <circle cx="26" cy="36" r="3" fill="#FFF" />
          <circle cx="50" cy="28" r="4" fill="#E11D48" />
          <circle cx="74" cy="36" r="3" fill="#FFF" />
        </g>
      )

    case 'vijay-kalash':
      return (
        <g filter="url(#avatarDropShadow)">
          {/* Coconut Top */}
          <ellipse cx="50" cy="30" rx="14" ry="16" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
          {/* Coconut Tufts */}
          <path d="M47,15 L50,8 L53,15 Z" fill="#78350F" />
          {/* Mango Leaves */}
          <path d="M50,42 Q28,26 22,38 Q36,44 50,44" fill="#15803D" stroke="#052E16" strokeWidth="1" />
          <path d="M50,42 Q72,26 78,38 Q64,44 50,44" fill="#15803D" stroke="#052E16" strokeWidth="1" />
          {/* Copper Pot Vessel */}
          <path
            d="M32,48 L68,48 C78,56 82,76 68,88 L32,88 C18,76 22,56 32,48 Z"
            fill="url(#rubyGrad)"
            stroke="#FFD700"
            strokeWidth="2"
          />
          {/* Swastika/Auspicious lines on Pot */}
          <circle cx="50" cy="68" r="7" fill="none" stroke="#FDE68A" strokeWidth="2.5" />
          <circle cx="50" cy="68" r="2.5" fill="#FDE68A" />
        </g>
      )

    default:
      return (
        <g filter="url(#avatarDropShadow)">
          <circle cx="50" cy="50" r="36" fill="url(#goldGrad)" />
          <circle cx="50" cy="50" r="16" fill="#9A3412" />
        </g>
      )
  }
}
