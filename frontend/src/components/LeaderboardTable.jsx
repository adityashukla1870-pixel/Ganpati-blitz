import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Sparkles } from 'lucide-react'
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
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
}

export default function LeaderboardTable({ entries = [], currentPlayerId }) {
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
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.4rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Rank
            </th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Player
            </th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Tier
            </th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Campus
            </th>
            <th style={{ textAlign: 'right', padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Universal Points
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
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
                    }}
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
  )
}
