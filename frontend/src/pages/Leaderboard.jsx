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
import PlayerAvatar from '../components/PlayerAvatar'
import { GAMES, GAME_LIST } from '../config/games'
import { CAMPUSES } from '../config/campuses'

const CAMPUS_OPTIONS = ['All Campuses', ...CAMPUSES]

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
  const [isOfflineFallback, setIsOfflineFallback] = useState(false)
  const [campus, setCampus] = useState('All Campuses')
  const [showStatsDrawer, setShowStatsDrawer] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('drawer=1')) return true
    return false
  })
  const currentPlayer = getPlayer()
  const playerId = currentPlayer?.player_id || currentPlayer?.id
  const currentUP = Number(
    currentPlayer?.universal_points ??
    localStorage.getItem('ganpati_universal_points') ??
    0
  )

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)

    // Ensure local UP cache is aligned
    if (currentUP > 0 && !localStorage.getItem('ganpati_universal_points')) {
      localStorage.setItem('ganpati_universal_points', String(currentUP))
    }

    try {
      const data = await getGlobalLeaderboard(campus, 50, 1, playerId)
      const rawList = data.leaderboard || []
      // Filter out any fake seed bots from display
      const list = rawList.filter((e) => !e.player_id?.startsWith('seed-'))
      setEntries(list)
      setIsOfflineFallback(false)

      if (list.length > 0) {
        localStorage.setItem(`ganpati_real_leaderboard_v2_${campus}`, JSON.stringify({ ...data, leaderboard: list }))
      }

      if (data.player_card) {
        setPlayerCard(data.player_card)
        // Sync local storage with server authoritative points
        if (data.player_card.universal_points !== undefined && currentPlayer) {
          currentPlayer.universal_points = data.player_card.universal_points
          localStorage.setItem('ganpati_player', JSON.stringify(currentPlayer))
          localStorage.setItem('ganpati_universal_points', String(data.player_card.universal_points))
        }
      } else if (currentPlayer) {
        const inList = list.find((e) => e.player_id === playerId)
        const effectiveUP = inList ? inList.universal_points : currentUP
        const effectiveRank = inList ? inList.rank : (list.length === 0 ? 1 : '-')
        setPlayerCard({
          player_id: playerId,
          display_name: currentPlayer.display_name || currentPlayer.name || 'Player',
          campus: currentPlayer.campus || 'Unknown',
          avatar: currentPlayer.avatar || 'shree-ganesha',
          universal_points: effectiveUP,
          global_rank: effectiveRank,
          tier: getRankTier(effectiveUP),
        })
      } else {
        setPlayerCard(null)
      }
    } catch (err) {
      // Try local cache first
      const cached = localStorage.getItem(`ganpati_real_leaderboard_v2_${campus}`)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          const validList = (parsed.leaderboard || []).filter((e) => !e.player_id?.startsWith('seed-'))
          if (validList.length > 0) {
            setEntries(validList)
            if (parsed.player_card) {
              setPlayerCard(parsed.player_card)
            } else if (currentPlayer) {
              setPlayerCard({
                player_id: playerId,
                display_name: currentPlayer.display_name || currentPlayer.name || 'Player',
                campus: currentPlayer.campus || 'Unknown',
                avatar: currentPlayer.avatar || 'shree-ganesha',
                universal_points: currentUP,
                global_rank: 1,
                tier: getRankTier(currentUP),
              })
            }
            setIsOfflineFallback(true)
            setError(null)
            return
          }
        } catch (_) {}
      }

      // No fake bots: show only real player if logged in, or empty
      if (currentPlayer) {
        const fallbackList = [
          {
            rank: 1,
            player_id: playerId,
            display_name: currentPlayer.display_name || currentPlayer.name || 'Player',
            campus: currentPlayer.campus || 'Unknown',
            avatar: currentPlayer.avatar || 'shree-ganesha',
            universal_points: currentUP,
            tier: getRankTier(currentUP),
            rating: currentPlayer.rating || 1000,
            games_played: currentPlayer.games_played || 1,
            wins: currentPlayer.wins || 0,
          },
        ]
        setEntries(fallbackList)
        setPlayerCard({
          player_id: playerId,
          display_name: currentPlayer.display_name || currentPlayer.name || 'Player',
          campus: currentPlayer.campus || 'Unknown',
          avatar: currentPlayer.avatar || 'shree-ganesha',
          universal_points: currentUP,
          global_rank: 1,
          tier: getRankTier(currentUP),
        })
      } else {
        setEntries([])
        setPlayerCard(null)
      }
      setIsOfflineFallback(true)
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
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(0.5rem, 2vw, 1rem) 4rem' }}>
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

        {/* Podium for Top 3 OR Spotlight if 1-2 contenders */}
        {entries.length >= 3 ? (
          <div style={{ margin: '0.75rem 0 1.5rem', width: '100%' }}>
            {/* Olympic 3-Step Podium Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 'clamp(0.35rem, 1.5vw, 0.75rem)',
                alignItems: 'end',
              }}
            >
              {/* ===== Rank 2 - Silver (Left) ===== */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.65, type: 'spring', damping: 14 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  order: 1,
                  minWidth: 0,
                }}
              >
                {/* Contender Card Body */}
                <div
                  style={{
                    width: '100%',
                    padding: 'clamp(0.75rem, 2vw, 1.1rem) clamp(0.3rem, 1.5vw, 0.6rem)',
                    textAlign: 'center',
                    background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.18) 0%, rgba(15, 23, 42, 0.75) 100%)',
                    border: '1.5px solid rgba(148, 163, 184, 0.5)',
                    borderBottom: 'none',
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {/* Medal & Rank Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.1rem' }}>
                    <span style={{ fontSize: '1.35rem', filter: 'drop-shadow(0 2px 6px rgba(148, 163, 184, 0.5))' }}>🥈</span>
                    <span
                      style={{
                        fontSize: 'clamp(0.55rem, 1.6vw, 0.65rem)',
                        fontWeight: 800,
                        color: '#CBD5E1',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: 'rgba(148, 163, 184, 0.15)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      #2 Contender
                    </span>
                  </div>

                  {/* Avatar */}
                  <div style={{ margin: '0.15rem 0' }}>
                    <PlayerAvatar
                      avatar={top2.avatar}
                      size={46}
                      tierColor="#94A3B8"
                      showGlow
                    />
                  </div>

                  {/* Player Name */}
                  <div
                    style={{
                      fontSize: 'clamp(0.78rem, 2.5vw, 1.05rem)',
                      fontWeight: 800,
                      color: '#F8FAFC',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 2px',
                    }}
                    title={top2.display_name}
                  >
                    {top2.display_name}
                  </div>

                  {/* Campus Chip */}
                  <div
                    style={{
                      fontSize: 'clamp(0.58rem, 1.8vw, 0.68rem)',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      maxWidth: '96%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    title={top2.campus}
                  >
                    {top2.campus || 'Campus'}
                  </div>

                  {/* Points */}
                  <div
                    style={{
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(0.95rem, 2.8vw, 1.3rem)',
                        fontWeight: 900,
                        color: '#E2E8F0',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {(top2.universal_points || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8' }}>UP</span>
                  </div>
                </div>

                {/* Podium Pedestal Step 2 */}
                <div
                  style={{
                    width: '100%',
                    height: 'clamp(42px, 9vw, 56px)',
                    background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.35) 0%, rgba(30, 41, 59, 0.9) 100%)',
                    border: '1.5px solid rgba(148, 163, 184, 0.6)',
                    borderTop: '3px solid #94A3B8',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.2), 0 6px 16px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono)',
                      color: '#F1F5F9',
                      lineHeight: 1,
                      textShadow: '0 0 10px rgba(148, 163, 184, 0.7)',
                    }}
                  >
                    2
                  </span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    2ND
                  </span>
                </div>
              </motion.div>

              {/* ===== Rank 1 - Gold (Center, Elevated) ===== */}
              <motion.div
                initial={{ opacity: 0, y: 70, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.75, type: 'spring', damping: 13 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  order: 2,
                  minWidth: 0,
                  transform: 'translateY(-12px)',
                  zIndex: 2,
                }}
              >
                {/* Contender Card Body */}
                <div
                  className="champion-card-glow"
                  style={{
                    width: '100%',
                    padding: 'clamp(0.95rem, 2.8vw, 1.35rem) clamp(0.35rem, 1.8vw, 0.75rem)',
                    textAlign: 'center',
                    background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.25) 0%, rgba(26, 16, 45, 0.85) 100%)',
                    border: '2px solid rgba(255, 215, 0, 0.75)',
                    borderBottom: 'none',
                    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {/* Floating Crown with Sparkles */}
                  <div
                    className="crown-floating"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      marginBottom: '-0.1rem',
                    }}
                  >
                    <span className="sparkle-twinkle" style={{ fontSize: '0.85rem' }}>✨</span>
                    <span style={{ fontSize: 'clamp(1.75rem, 4.8vw, 2.35rem)', filter: 'drop-shadow(0 0 14px rgba(255, 215, 0, 0.8))' }}>
                      👑
                    </span>
                    <span className="sparkle-twinkle" style={{ fontSize: '0.85rem', animationDelay: '1s' }}>✨</span>
                  </div>

                  {/* Champion Pill Badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: 'clamp(0.62rem, 1.9vw, 0.72rem)',
                      fontWeight: 900,
                      color: '#1a0d00',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      background: 'linear-gradient(135deg, #FFE066, #FFB703)',
                      padding: '0.18rem 0.55rem',
                      borderRadius: '9999px',
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Sparkles size={11} /> Champion
                  </div>

                  {/* Avatar with Radiant Gold Halo */}
                  <div style={{ margin: '0.2rem 0' }}>
                    <PlayerAvatar
                      avatar={top1.avatar}
                      size={56}
                      tierColor="#FFD700"
                      showGlow
                    />
                  </div>

                  {/* Champion Name */}
                  <div
                    style={{
                      fontSize: 'clamp(0.88rem, 3vw, 1.25rem)',
                      fontWeight: 900,
                      color: '#FFF',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: '0 0 12px rgba(255, 215, 0, 0.5)',
                      padding: '0 2px',
                    }}
                    title={top1.display_name}
                  >
                    {top1.display_name}
                  </div>

                  {/* Campus Chip */}
                  <div
                    style={{
                      fontSize: 'clamp(0.6rem, 2vw, 0.72rem)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      background: 'rgba(255, 215, 0, 0.12)',
                      padding: '0.12rem 0.5rem',
                      borderRadius: '4px',
                      maxWidth: '96%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                    }}
                    title={top1.campus}
                  >
                    {top1.campus || 'Campus'}
                  </div>

                  {/* Points */}
                  <div
                    style={{
                      marginTop: '0.25rem',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(1.15rem, 3.6vw, 1.65rem)',
                        fontWeight: 900,
                        color: '#FFD700',
                        fontFamily: 'var(--font-mono)',
                        textShadow: '0 0 14px rgba(255, 215, 0, 0.6)',
                      }}
                    >
                      {(top1.universal_points || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#FFD700' }}>UP</span>
                  </div>
                </div>

                {/* Podium Pedestal Step 1 (Highest Step) */}
                <div
                  style={{
                    width: '100%',
                    height: 'clamp(58px, 13vw, 76px)',
                    background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.4) 0%, rgba(55, 35, 10, 0.95) 100%)',
                    border: '2px solid rgba(255, 215, 0, 0.75)',
                    borderTop: '4px solid #FFD700',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 3px 10px rgba(255, 215, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(1.4rem, 4.5vw, 2.1rem)',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono)',
                      color: '#FFD700',
                      lineHeight: 1,
                      textShadow: '0 0 16px rgba(255, 215, 0, 0.8)',
                    }}
                  >
                    1
                  </span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#FFD700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    WINNER
                  </span>
                </div>
              </motion.div>

              {/* ===== Rank 3 - Bronze (Right) ===== */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.65, type: 'spring', damping: 14 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  order: 3,
                  minWidth: 0,
                }}
              >
                {/* Contender Card Body */}
                <div
                  style={{
                    width: '100%',
                    padding: 'clamp(0.7rem, 1.8vw, 1rem) clamp(0.3rem, 1.5vw, 0.6rem)',
                    textAlign: 'center',
                    background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.18) 0%, rgba(15, 23, 42, 0.75) 100%)',
                    border: '1.5px solid rgba(205, 127, 50, 0.5)',
                    borderBottom: 'none',
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {/* Medal & Rank Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.1rem' }}>
                    <span style={{ fontSize: '1.35rem', filter: 'drop-shadow(0 2px 6px rgba(205, 127, 50, 0.5))' }}>🥉</span>
                    <span
                      style={{
                        fontSize: 'clamp(0.55rem, 1.6vw, 0.65rem)',
                        fontWeight: 800,
                        color: '#FDBA74',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: 'rgba(205, 127, 50, 0.15)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        border: '1px solid rgba(205, 127, 50, 0.3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      #3 Contender
                    </span>
                  </div>

                  {/* Avatar */}
                  <div style={{ margin: '0.15rem 0' }}>
                    <PlayerAvatar
                      avatar={top3.avatar}
                      size={44}
                      tierColor="#CD7F32"
                      showGlow
                    />
                  </div>

                  {/* Player Name */}
                  <div
                    style={{
                      fontSize: 'clamp(0.78rem, 2.5vw, 1.05rem)',
                      fontWeight: 800,
                      color: '#F8FAFC',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 2px',
                    }}
                    title={top3.display_name}
                  >
                    {top3.display_name}
                  </div>

                  {/* Campus Chip */}
                  <div
                    style={{
                      fontSize: 'clamp(0.58rem, 1.8vw, 0.68rem)',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      maxWidth: '96%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    title={top3.campus}
                  >
                    {top3.campus || 'Campus'}
                  </div>

                  {/* Points */}
                  <div
                    style={{
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(0.95rem, 2.8vw, 1.3rem)',
                        fontWeight: 900,
                        color: '#FDBA74',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {(top3.universal_points || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#CD7F32' }}>UP</span>
                  </div>
                </div>

                {/* Podium Pedestal Step 3 */}
                <div
                  style={{
                    width: '100%',
                    height: 'clamp(28px, 6.5vw, 38px)',
                    background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.35) 0%, rgba(45, 25, 10, 0.9) 100%)',
                    border: '1.5px solid rgba(205, 127, 50, 0.6)',
                    borderTop: '3px solid #CD7F32',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.15), 0 6px 16px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(0.95rem, 3vw, 1.35rem)',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono)',
                      color: '#FED7AA',
                      lineHeight: 1,
                      textShadow: '0 0 10px rgba(205, 127, 50, 0.6)',
                    }}
                  >
                    3
                  </span>
                  <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#CD7F32', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    3RD
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        ) : entries.length >= 1 ? (
          <motion.div
            variants={itemVariants}
            style={{
              maxWidth: 420,
              margin: '0.5rem auto 1.25rem',
              width: '100%',
            }}
          >
            <div
              className="champion-card-glow"
              style={{
                padding: '1.4rem 1rem',
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.22) 0%, rgba(20, 15, 40, 0.8) 100%)',
                border: '2px solid rgba(255, 215, 0, 0.7)',
                borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <div className="crown-floating" style={{ fontSize: '2.4rem', filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.7))' }}>
                👑
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  color: '#1a0d00',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'linear-gradient(135deg, #FFE066, #FFB703)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                }}
              >
                <Sparkles size={12} /> Current #1 Champion
              </div>
              <div style={{ margin: '0.2rem 0' }}>
                <PlayerAvatar
                  avatar={entries[0].avatar}
                  size={52}
                  tierColor="#FFD700"
                  showGlow
                />
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFF' }}>
                {entries[0].display_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {entries[0].campus}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFD700', fontFamily: 'var(--font-mono)' }}>
                {(entries[0].universal_points || 0).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>UP</span>
              </div>
            </div>
            {/* Podium Base for Single Spotlight */}
            <div
              style={{
                width: '100%',
                height: 48,
                background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.35) 0%, rgba(55, 35, 10, 0.9) 100%)',
                border: '2px solid rgba(255, 215, 0, 0.7)',
                borderTop: '3px solid #FFD700',
                borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#FFD700',
                fontWeight: 900,
                fontSize: '1.1rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ★ RANK 1 CHAMPION ★
            </div>
          </motion.div>
        ) : null}

        {/* Current Player Standing Card */}
        {playerCard && (
          <motion.div
            variants={itemVariants}
            style={{
              padding: 'clamp(0.85rem, 2vw, 1.2rem)',
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.16) 0%, rgba(255, 215, 0, 0.08) 100%)',
              border: '1px solid rgba(255, 107, 53, 0.45)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.85rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            {/* Left: Player Profile & Tier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px', flex: '1 1 auto' }}>
              <PlayerAvatar
                avatar={playerCard.avatar}
                size={46}
                tierColor={playerCard.tier?.color || 'var(--primary)'}
                showGlow
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFF' }}>{playerCard.display_name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({playerCard.campus})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: playerCard.tier?.color || '#FFD700',
                      background: playerCard.tier?.bg,
                      padding: '0.12rem 0.5rem',
                      borderRadius: '4px',
                      border: `1px solid ${playerCard.tier?.border}`,
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>{playerCard.tier?.badge}</span>
                    <span>{playerCard.tier?.name}</span>
                  </span>
                  {playerCard.percentile !== undefined && playerCard.percentile > 0 && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--success, #10B981)',
                        background: 'rgba(16, 185, 129, 0.12)',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      Top {100 - Math.round(playerCard.percentile)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Symmetrical Stats Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                gap: 'clamp(0.85rem, 2vw, 1.5rem)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 0, 0, 0.28)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flex: '1 1 200px',
              }}
            >
              {/* Global Rank */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Global Rank
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFF', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
                  #{playerCard.global_rank || '-'}
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 32, background: 'rgba(255, 255, 255, 0.12)' }} />

              {/* Universal Points */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Universal Points
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: playerCard.tier?.color || '#FFD700', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
                  {(playerCard.universal_points || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Guest CTA if no player logged in */}
        {!currentPlayer && (
          <motion.div
            variants={itemVariants}
            style={{
              padding: '1rem 1.25rem',
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#FFD700', fontSize: '0.95rem' }}>Want to see your ranking here?</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Log in or create a player profile to earn Universal Points and claim your place on the board.
              </div>
            </div>
            <Link
              to="/player"
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
                color: '#1a0800',
                fontWeight: 800,
                fontSize: '0.82rem',
                textDecoration: 'none',
              }}
            >
              Log In / Register
            </Link>
          </motion.div>
        )}

        {/* Filter Controls & "My Game Records" Action Toolbar */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          {/* Left Group: Campus select + Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 auto', minWidth: '220px' }}>
            <select
              className="form-select"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.55rem 0.85rem',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              {CAMPUS_OPTIONS.map((c) => (
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
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </motion.button>
          </div>

          {/* Right Group: My Game Records Action */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
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
              justifyContent: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              flex: '1 1 180px',
            }}
          >
            <BookOpen size={16} />
            <span>My Game Records</span>
          </motion.button>
        </motion.div>

        {/* Offline / Cached Notice */}
        {isOfflineFallback && (
          <motion.div
            variants={itemVariants}
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              color: '#FCD34D',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <span>Multiplayer backend is connecting. Showing local standings.</span>
            </div>
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '6px',
                color: '#FDE68A',
                padding: '0.35rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Retry Live
            </button>
          </motion.div>
        )}

        {/* Global Leaderboard Table */}
        <motion.div variants={itemVariants}>
          {loading && entries.length === 0 ? (
            <LoadingScreen message="Loading global leaderboard..." />
          ) : error && entries.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Trophy size={48} style={{ color: 'var(--danger)', opacity: 0.5, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--danger)', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{error}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Please verify backend connection or try again.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 'clamp(0.6rem, 2vw, 1.25rem)', overflow: 'hidden' }}>
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
