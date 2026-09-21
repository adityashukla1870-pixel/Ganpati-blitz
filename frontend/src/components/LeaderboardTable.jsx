import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Sparkles, ChevronDown, ChevronUp, ChevronsDown, Users, Target } from 'lucide-react'
import { getRankTier } from '../config/universalPoints'

const rankMedals = {
  1: <Trophy size={20} style={{ color: '#FFD700', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }} />,
  2: <Award size={20} style={{ color: '#E2E8F0', filter: 'drop-shadow(0 0 4px rgba(226,232,240,0.5))' }} />,
  3: <Medal size={20} style={{ color: '#F97316', filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.4))' }} />,
}

const rankBorderColors = {
  1: '#FFD700',
  2: '#E2E8F0',
  3: '#F97316',
}

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: Math.min((i % 10) * 0.03, 0.25), duration: 0.35, ease: 'easeOut' },
  }),
}

export default function LeaderboardTable({ entries = [], currentPlayerId }) {
  const [visibleCount, setVisibleCount] = useState(10)

  // Reset to top 10 when entries prop updates (e.g. campus filter change or refresh)
  useEffect(() => {
    setVisibleCount(10)
  }, [entries])

  const visibleEntries = useMemo(() => {
    return (entries || []).slice(0, visibleCount)
  }, [entries, visibleCount])

  const currentPlayerIndex = useMemo(() => {
    if (!currentPlayerId || !entries) return -1
    return entries.findIndex(
      (e) => e.player_id === currentPlayerId || (e.id && e.id === currentPlayerId)
    )
  }, [entries, currentPlayerId])

  const isPlayerOutsideVisible = currentPlayerIndex >= visibleCount

  if (!entries || entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
        <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.35 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '0 0 0.5rem', fontWeight: 600 }}>
          No contenders on the global board yet!
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
          Play any of the 6 games to earn Universal Points and claim your rank.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card List (< 640px): 100% full-width, zero horizontal clipping */}
      <div className="leaderboard-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        {visibleEntries.map((entry, i) => {
          const isCurrentPlayer = Boolean(currentPlayerId) && (entry.player_id === currentPlayerId || (Boolean(entry.id) && entry.id === currentPlayerId))
          const rank = entry.rank || i + 1
          const borderColor = rankBorderColors[rank]
          const points = entry.universal_points ?? entry.best_score ?? entry.score ?? 0
          const tier = entry.tier || getRankTier(points)

          return (
            <motion.div
              key={entry.player_id || entry.id || i}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={rowVariants}
              whileHover={{ scale: 1.01 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: isCurrentPlayer
                  ? 'linear-gradient(90deg, rgba(255, 107, 53, 0.22) 0%, rgba(255, 107, 53, 0.08) 100%)'
                  : rank === 1
                    ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.14) 0%, rgba(20, 15, 40, 0.6) 100%)'
                    : 'rgba(15, 23, 42, 0.55)',
                border: isCurrentPlayer
                  ? '1px solid rgba(255, 107, 53, 0.55)'
                  : borderColor
                    ? `1px solid ${borderColor}55`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: borderColor
                  ? `4px solid ${borderColor}`
                  : isCurrentPlayer
                    ? '4px solid var(--primary)'
                    : '4px solid rgba(255, 255, 255, 0.15)',
                boxShadow: isCurrentPlayer ? '0 2px 12px rgba(255,107,53,0.2)' : 'none',
              }}
            >
              {/* Left: Rank & Avatar & Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                {/* Rank Badge */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    color: borderColor || 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {rankMedals[rank] || `#${rank}`}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: 'var(--radius-full)',
                    background: tier.bg || 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${borderColor || tier.color || 'rgba(255,255,255,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                  }}
                >
                  {entry.avatar || '🪷'}
                </div>

                {/* Name & Subtext */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        color: isCurrentPlayer ? 'var(--primary)' : '#FFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                      title={entry.display_name}
                    >
                      {entry.display_name}
                    </span>
                    {isCurrentPlayer && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 900,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '3px',
                          background: 'rgba(255,107,53,0.3)',
                          color: 'var(--primary)',
                          textTransform: 'uppercase',
                          flexShrink: 0,
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      marginTop: '0.15rem',
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span style={{ color: tier.color, fontWeight: 700, flexShrink: 0 }}>
                      {tier.badge} {tier.name}
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={entry.campus}
                    >
                      {entry.campus || 'Campus'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Universal Points */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: tier.color,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.1,
                  }}
                >
                  {points.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  UP
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Desktop / Tablet Table View (>= 641px) */}
      <div className="leaderboard-desktop-only" style={{ width: '100%', overflowX: 'auto' }}>
        <table className="leaderboard-table" style={{ width: '100%', minWidth: '580px', borderCollapse: 'separate', borderSpacing: '0 0.4rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', width: '80px' }}>
                Rank
              </th>
              <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Player
              </th>
              <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', width: '130px' }}>
                Tier
              </th>
              <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Campus
              </th>
              <th style={{ textAlign: 'right', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', width: '150px' }}>
                Universal Points
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry, i) => {
              const isCurrentPlayer = Boolean(currentPlayerId) && (entry.player_id === currentPlayerId || (Boolean(entry.id) && entry.id === currentPlayerId))
              const rank = entry.rank || i + 1
              const borderColor = rankBorderColors[rank]
              const points = entry.universal_points ?? entry.best_score ?? entry.score ?? 0
              const tier = entry.tier || getRankTier(points)

              return (
                <motion.tr
                  key={entry.player_id || entry.id || i}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                  style={{
                    background: isCurrentPlayer
                      ? 'rgba(255, 107, 53, 0.16)'
                      : rank === 1
                        ? 'rgba(255, 215, 0, 0.08)'
                        : 'rgba(15, 52, 96, 0.35)',
                    boxShadow: isCurrentPlayer ? '0 0 16px rgba(255,107,53,0.2)' : 'none',
                  }}
                >
                  {/* Rank Column */}
                  <td
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                      borderLeft: borderColor ? `3px solid ${borderColor}` : isCurrentPlayer ? '3px solid var(--primary)' : '3px solid transparent',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: rank <= 3 ? borderColor : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {rankMedals[rank] || <span style={{ fontFamily: 'var(--font-mono)' }}>#{rank}</span>}
                    </div>
                  </td>

                  {/* Player Name Column */}
                  <td
                    style={{
                      padding: '0.75rem 0.9rem',
                      fontWeight: 600,
                      color: isCurrentPlayer ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{entry.avatar || '🪷'}</span>
                      <span style={{ fontWeight: isCurrentPlayer ? 800 : 600 }}>{entry.display_name}</span>
                      {isCurrentPlayer && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(255,107,53,0.25)',
                            color: 'var(--primary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Rank Tier Column */}
                  <td style={{ padding: '0.75rem 0.9rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: tier.color,
                        background: tier.bg,
                        border: `1px solid ${tier.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{tier.badge}</span>
                      <span>{tier.name}</span>
                    </span>
                  </td>

                  {/* Campus Column */}
                  <td style={{ padding: '0.75rem 0.9rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-muted)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'inline-block',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={entry.campus}
                    >
                      {entry.campus || 'Campus'}
                    </span>
                  </td>

                  {/* Universal Points Column */}
                  <td
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                      textAlign: 'right',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      color: tier.color,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <span>{points.toLocaleString()}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>UP</span>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Show More / Top 10 Controls (Only when entries > 10) */}
      {entries.length > 10 && (
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
          }}
        >
          {/* Status info: Showing Top X of Y contenders */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted, #94A3B8)',
              fontWeight: 600,
            }}
          >
            <Users size={14} style={{ color: 'var(--festival-gold, #FFD700)' }} />
            <span>
              Showing <strong style={{ color: '#FFF' }}>Top {Math.min(visibleCount, entries.length)}</strong> of{' '}
              <strong style={{ color: '#FFF' }}>{entries.length}</strong> contenders
            </span>
          </div>

          {/* Action Buttons Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            {visibleCount < entries.length ? (
              <>
                {/* Show More (+10) */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 10, entries.length))}
                  style={{
                    padding: '0.65rem 1.35rem',
                    borderRadius: 'var(--radius-full, 9999px)',
                    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.22) 0%, rgba(255, 215, 0, 0.16) 100%)',
                    border: '1.5px solid rgba(255, 215, 0, 0.45)',
                    color: '#FFD700',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 16px rgba(255, 215, 0, 0.14)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>Show More (+{Math.min(10, entries.length - visibleCount)})</span>
                  <ChevronDown size={16} />
                </motion.button>

                {/* Show All */}
                {entries.length - visibleCount > 10 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVisibleCount(entries.length)}
                    style={{
                      padding: '0.65rem 1.15rem',
                      borderRadius: 'var(--radius-full, 9999px)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--text, #FFF)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>Show All ({entries.length})</span>
                    <ChevronsDown size={15} />
                  </motion.button>
                )}

                {/* Quick Jump to User's Rank if outside visible items */}
                {isPlayerOutsideVisible && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVisibleCount(Math.max(visibleCount, currentPlayerIndex + 1))}
                    style={{
                      padding: '0.65rem 1.05rem',
                      borderRadius: 'var(--radius-full, 9999px)',
                      background: 'rgba(255, 107, 53, 0.15)',
                      border: '1px solid rgba(255, 107, 53, 0.4)',
                      color: 'var(--primary, #FF6B35)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Target size={14} />
                    <span>Find My Rank (#{currentPlayerIndex + 1})</span>
                  </motion.button>
                )}
              </>
            ) : (
              /* Show Less (Top 10) */
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setVisibleCount(10)}
                style={{
                  padding: '0.6rem 1.35rem',
                  borderRadius: 'var(--radius-full, 9999px)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-muted, #CBD5E1)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Show Less (Top 10)</span>
                <ChevronUp size={15} />
              </motion.button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
