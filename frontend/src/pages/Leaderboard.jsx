import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RefreshCw, Trophy, Crown, Sparkles, BookOpen, X, ChevronRight, Zap, Target } from 'lucide-react'
import LeaderboardTable from '../components/LeaderboardTable'
import LoadingScreen from '../components/LoadingScreen'
import { getGlobalLeaderboard } from '../services/api'
import { getPlayer } from '../utils/storage'
import { getRankTier } from '../config/universalPoints'
import { GAMES, GAME_LIST } from '../config/games'

const CAMPUSES = [
  'All Campuses',
  'NIAT Jaipur',
  'NIAT Delhi',
  'NIAT Pune',
  'NIAT Bangalore',
  'NIAT Hyderabad',
  'NIAT Chennai',
  'NIAT Mumbai',
  'Other',
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [playerCard, setPlayerCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [campus, setCampus] = useState('All Campuses')
  const [showStatsDrawer, setShowStatsDrawer] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('drawer=1')) return true
    return false
  })
  const currentPlayer = getPlayer()
  const playerId = currentPlayer?.player_id || currentPlayer?.id

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGlobalLeaderboard(campus, 50, 1, playerId)
      setEntries(data.leaderboard || [])
      if (data.player_card) {
        setPlayerCard(data.player_card)
      } else if (currentPlayer) {
        // Local fallback player card
        const localUP = parseInt(localStorage.getItem('ganpati_universal_points') || '0', 10)
        setPlayerCard({
          player_id: playerId,
          display_name: currentPlayer.display_name || currentPlayer.name || 'Player',
          campus: currentPlayer.campus || 'Unknown',
          avatar: currentPlayer.avatar || '🪷',
          universal_points: localUP,
          global_rank: '-',
          tier: getRankTier(localUP),
        })
      }
    } catch (err) {
      setError('Global leaderboard temporarily unavailable')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [campus])

  // Compute Top 3 for Podium
  const top1 = entries[0]
  const top2 = entries[1]
  const top3 = entries[2]

  // Personal Game Records helper
  const getPersonalRecords = () => {
    return GAME_LIST.map((game) => {
      const key = `ganpati_best_${game.id.replace(/-/g, '_')}`
      const bestScore = parseInt(localStorage.getItem(key) || '0', 10)
      const unlockedTiersKey = `ganpati_unlocked_diff_${game.id}`
      const unlockedTiers = JSON.parse(localStorage.getItem(unlockedTiersKey) || '["easy", "normal"]')
      const highestTier = unlockedTiers[unlockedTiers.length - 1] || 'normal'

      return {
        ...game,
        bestScore,
        highestTier,
      }
    })
  }

  const personalRecords = getPersonalRecords()

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '1.5rem 1rem 4rem' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Title Header */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(255,215,0,0.12)',
              border: '1px solid rgba(255,215,0,0.3)',
              color: '#FFD700',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.75rem',
            }}
          >
            <Crown size={15} /> All-Arcade Competitive Ranking
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 4.5vw, 2.4rem)',
              fontWeight: 900,
              margin: '0 0 0.5rem',
              fontFamily: 'var(--font-display, inherit)',
              background: 'linear-gradient(135deg, var(--festival-gold, #FFD166), var(--festival-saffron, #FF8C42))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.02em',
            }}
          >
            GLOBAL UNIVERSAL LEADERBOARD
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Compete across all 6 mini-games for Universal Points. Normalized by difficulty, precision, and mastery.
          </p>
        </motion.div>

        {/* Podium for Top 3 */}
        {entries.length >= 3 && (
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.5rem',
              alignItems: 'end',
              margin: '0.5rem 0',
            }}
          >
            {/* Rank 2 - Silver (Left) */}
            <div
              className="card"
              style={{
                padding: '1rem 0.4rem',
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: 'var(--radius-lg)',
                order: 1,
                minWidth: 0,
              }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>🥈</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>#2 Contender</div>
              <div style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.05rem)', fontWeight: 800, color: '#F1F5F9', margin: '0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {top2.display_name}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top2.campus}</div>
              <div style={{ fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)', fontWeight: 900, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                {(top2.universal_points || 0).toLocaleString()} <span style={{ fontSize: '0.65rem' }}>UP</span>
              </div>
            </div>

            {/* Rank 1 - Gold (Center, Elevated) */}
            <div
              className="card"
              style={{
                padding: '1.4rem 0.4rem',
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.2) 0%, rgba(20, 15, 40, 0.7) 100%)',
                border: '2px solid rgba(255, 215, 0, 0.6)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 0 25px rgba(255, 215, 0, 0.25)',
                order: 2,
                transform: 'translateY(-6px)',
                minWidth: 0,
              }}
            >
              <div style={{ fontSize: '2.1rem', marginBottom: '0.2rem', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.6))' }}>👑</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Champion</div>
              <div style={{ fontSize: 'clamp(0.95rem, 3vw, 1.25rem)', fontWeight: 900, color: '#FFF', margin: '0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {top1.display_name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top1.campus}</div>
              <div style={{ fontSize: 'clamp(1.1rem, 3.2vw, 1.5rem)', fontWeight: 900, color: '#FFD700', fontFamily: 'var(--font-mono)' }}>
                {(top1.universal_points || 0).toLocaleString()} <span style={{ fontSize: '0.68rem' }}>UP</span>
              </div>
            </div>

            {/* Rank 3 - Bronze (Right) */}
            <div
              className="card"
              style={{
                padding: '0.9rem 0.4rem',
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)',
                border: '1px solid rgba(205, 127, 50, 0.4)',
                borderRadius: 'var(--radius-lg)',
                order: 3,
                minWidth: 0,
              }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>🥉</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#CD7F32', textTransform: 'uppercase' }}>#3 Contender</div>
              <div style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.05rem)', fontWeight: 800, color: '#F1F5F9', margin: '0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {top3.display_name}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top3.campus}</div>
              <div style={{ fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)', fontWeight: 900, color: '#CD7F32', fontFamily: 'var(--font-mono)' }}>
                {(top3.universal_points || 0).toLocaleString()} <span style={{ fontSize: '0.65rem' }}>UP</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Player Standing Card */}
        {playerCard && (
          <motion.div
            variants={itemVariants}
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 215, 0, 0.08))',
              border: '1px solid rgba(255, 107, 53, 0.4)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-full)',
                  background: playerCard.tier?.bg || 'rgba(255,255,255,0.1)',
                  border: `2px solid ${playerCard.tier?.color || 'var(--primary)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                }}
              >
                {playerCard.avatar || '🪷'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFF' }}>{playerCard.display_name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({playerCard.campus})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: playerCard.tier?.color || '#FFD700',
                      background: playerCard.tier?.bg,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      border: `1px solid ${playerCard.tier?.border}`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {playerCard.tier?.badge} {playerCard.tier?.name}
                  </span>
                  {playerCard.percentile !== undefined && playerCard.percentile > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                      Top {100 - Math.round(playerCard.percentile)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Global Rank
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFF', fontFamily: 'var(--font-mono)' }}>
                  #{playerCard.global_rank || '-'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Universal Points
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: playerCard.tier?.color || '#FFD700', fontFamily: 'var(--font-mono)' }}>
                  {(playerCard.universal_points || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Controls & "My Game Records" Action */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              className="form-select"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              style={{ minWidth: '180px', padding: '0.55rem 1rem', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
            >
              {CAMPUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchLeaderboard}
              disabled={loading}
              style={{
                padding: '0.55rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-md)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowStatsDrawer(true)}
            style={{
              padding: '0.55rem 1.1rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--secondary, #FFD700)',
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <BookOpen size={15} /> My Game Records
          </motion.button>
        </motion.div>

        {/* Global Leaderboard Table */}
        <motion.div variants={itemVariants}>
          {loading && entries.length === 0 ? (
            <LoadingScreen message="Loading global leaderboard..." />
          ) : error ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Trophy size={48} style={{ color: 'var(--danger)', opacity: 0.5, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--danger)', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{error}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Please verify backend connection or try again.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
              <LeaderboardTable entries={entries} currentPlayerId={playerId} />
            </div>
          )}
        </motion.div>

        {/* Back Button */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: '0.75rem 1.8rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text)',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ArrowLeft size={16} /> Back to Home
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Personal Game Records Drawer Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showStatsDrawer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
            onClick={() => setShowStatsDrawer(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                width: '100%',
                maxWidth: 440,
                height: '100%',
                background: 'var(--card, #0f172a)',
                borderLeft: '1px solid rgba(255,255,255,0.12)',
                padding: '1.75rem 1.25rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.2rem', color: '#FFF' }}>
                    My Game Records
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Personal Bests & Mastery Tiers across all 6 games
                  </p>
                </div>
                <button
                  onClick={() => setShowStatsDrawer(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    width: 34,
                    height: 34,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Notice that rankings are unified */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  color: '#93C5FD',
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Universal Leaderboard Active:</strong> Individual games track personal milestones and unlocked difficulties. Your competitive rank is decided by Universal Points on the Global Leaderboard.
              </div>

              {/* Game Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {personalRecords.map((game) => (
                  <div
                    key={game.id}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                        }}
                      >
                        {game.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFF' }}>{game.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Highest Cleared:{' '}
                          <span style={{ color: 'var(--secondary)', textTransform: 'capitalize', fontWeight: 600 }}>
                            {game.highestTier}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Personal Best
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>
                        {game.bestScore.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => setShowStatsDrawer(false)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: '#000',
                    cursor: 'pointer',
                  }}
                >
                  Close Records
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  )
}
