import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import {
  Trophy,
  Flame,
  Star,
  Award,
  Gamepad2,
  Calendar,
  Crown,
  ArrowLeft,
  Check,
  Lock,
  Sparkles,
  Edit3,
  X,
  Play,
  RefreshCw,
  Zap,
  Swords,
} from 'lucide-react'
import { getPlayer, setPlayer as savePlayerToStorage, getUniversalPoints } from '../utils/storage'
import { getProfile, getPlayerAchievements, getMatchHistory, updatePlayerAvatar } from '../services/api'
import { getRankTier } from '../config/universalPoints'
import PlayerAvatar from '../components/PlayerAvatar'
import { AVATAR_LIST, resolveAvatarId, getAvatarMeta } from '../config/avatars'

const GAME_LIST = [
  { id: 'modak-rush', name: 'Modak Rush', icon: '🥟', route: '/game/modak-rush' },
  { id: 'diya-dash', name: 'Diya Dash', icon: '🪔', route: '/game/diya-dash' },
  { id: 'dhol-battle', name: 'Dhol Battle', icon: '🥁', route: '/game/dhol-battle' },
  { id: 'rangoli-rush', name: 'Rangoli Rush', icon: '🎨', route: '/game/rangoli-rush' },
  { id: 'mushak-maze', name: 'Mushak Maze', icon: '🐭', route: '/game/mushak-maze' },
  { id: 'ganpati-logic', name: 'Ganpati Logic', icon: '🧩', route: '/game/ganpati-logic' },
]

const AVATAR_COLORS = [
  '#FF6B35', '#FFD700', '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C',
]

const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 3000]

function calculateProgression(totalXp) {
  let level = 1
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (totalXp >= XP_THRESHOLDS[i]) {
      level = i + 1
    } else {
      break
    }
  }
  if (level === XP_THRESHOLDS.length && totalXp >= XP_THRESHOLDS[XP_THRESHOLDS.length - 1]) {
    level += Math.floor((totalXp - XP_THRESHOLDS[XP_THRESHOLDS.length - 1]) / 500)
  }

  let currentThreshold, nextThreshold
  if (level < XP_THRESHOLDS.length) {
    currentThreshold = XP_THRESHOLDS[level - 1]
    nextThreshold = XP_THRESHOLDS[level]
  } else {
    currentThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + (level - XP_THRESHOLDS.length) * 500
    nextThreshold = currentThreshold + 500
  }

  const progressXp = Math.max(0, totalXp - currentThreshold)
  const progressRequired = Math.max(1, nextThreshold - currentThreshold)

  return {
    level,
    total_xp: totalXp,
    current_level_xp: currentThreshold,
    next_level_xp: nextThreshold,
    progress_xp: progressXp,
    progress_required: progressRequired,
  }
}

function getTitleForLevel(level, rankTierName) {
  if (level >= 10) return `Divine Legend • ${rankTierName}`
  if (level >= 8) return `Sacred Guardian • ${rankTierName}`
  if (level >= 6) return `Festival Champion • ${rankTierName}`
  if (level >= 4) return `Modak Apprentice • ${rankTierName}`
  if (level >= 2) return `Temple Sprinter • ${rankTierName}`
  return `Aarambh Seeker • ${rankTierName}`
}

const cardStyle = {
  background: 'var(--glass-bg, rgba(20, 10, 35, 0.75))',
  border: '1px solid var(--glass-border, rgba(255, 215, 0, 0.15))',
  borderRadius: 'var(--radius-xl, 18px)',
  padding: '18px 16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(12px)',
}

const sectionTitleStyle = {
  fontFamily: 'var(--font-display, Poppins, sans-serif)',
  fontSize: '0.95rem',
  fontWeight: 800,
  color: 'var(--text)',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const containerAnim = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } },
}

export default function ProfilePage({ player: playerProp, onPlayerSetup }) {
  const navigate = useNavigate()
  const [player, setPlayerState] = useState(() => playerProp || getPlayer())
  const playerId = player?.player_id || player?.id || ''

  const [profile, setProfile] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

  // Synchronize player prop
  useEffect(() => {
    if (playerProp) setPlayerState(playerProp)
  }, [playerProp])

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!playerId) {
      setLoading(false)
      return
    }
    if (isManualRefresh) setRefreshing(true)

    try {
      const [profRes, achRes, histRes] = await Promise.allSettled([
        getProfile(playerId),
        getPlayerAchievements(playerId),
        getMatchHistory(playerId),
      ])

      if (profRes.status === 'fulfilled' && profRes.value) {
        setProfile(profRes.value)
        if (profRes.value.player) {
          const sPlayer = profRes.value.player
          setPlayerState((prev) => {
            const merged = { ...prev, ...sPlayer }
            savePlayerToStorage(merged)
            return merged
          })
        }
      }

      if (achRes.status === 'fulfilled' && achRes.value) {
        const rawAch = achRes.value.achievements || []
        const unlockedList = achRes.value.unlocked || []
        const unlockedIds = new Set(unlockedList.map((u) => u.achievement_id || u.id))

        const mergedAch = rawAch.map((a) => {
          let isUnlocked = unlockedIds.has(a.id)
          const modakPB = parseInt(localStorage.getItem('ganpati_best_modak_rush') || '0', 10)
          const diyaPB = parseInt(localStorage.getItem('ganpati_best_diya_dash') || '0', 10)
          const mazePB = parseInt(localStorage.getItem('ganpati_best_mushak_maze') || '0', 10)

          if (a.id === 'first-play' && (modakPB > 0 || diyaPB > 0 || mazePB > 0)) isUnlocked = true
          if (a.id === 'modak-master' && modakPB >= 1000) isUnlocked = true
          if (a.id === 'memory-master' && diyaPB >= 400) isUnlocked = true
          if (a.id === 'speed-demon' && mazePB > 0) isUnlocked = true

          return {
            ...a,
            unlocked: isUnlocked,
          }
        })
        setAchievements(mergedAch)
      }

      if (histRes.status === 'fulfilled' && histRes.value) {
        setHistory(histRes.value.history || [])
      }

      if (isManualRefresh) showToast('Profile synced with server!')
    } catch (err) {
      console.warn('Profile load partial failure:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [playerId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const universalPoints = useMemo(() => {
    return (
      profile?.player?.universal_points ??
      profile?.competitive?.universal_points ??
      profile?.universalPoints ??
      getUniversalPoints()
    )
  }, [profile])

  const globalRank = profile?.player?.global_rank ?? profile?.competitive?.global_rank ?? '1'
  const rankTier = useMemo(() => {
    return profile?.player?.rank_tier ?? getRankTier(universalPoints)
  }, [profile, universalPoints])

  const bestScores = useMemo(() => {
    return GAME_LIST.map((g) => {
      const key = 'ganpati_best_' + g.id.replace(/-/g, '_')
      const localBest = parseInt(localStorage.getItem(key) || '0', 10)
      const serverBest = profile?.best_scores?.[g.id] || 0
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        route: g.route,
        score: Math.max(localBest, serverBest),
      }
    })
  }, [profile])

  const totalGamesPlayed = useMemo(() => {
    if (profile?.stats?.games_played && profile.stats.games_played > 0) {
      return profile.stats.games_played
    }
    const playedCount = bestScores.filter((b) => b.score > 0).length
    return Math.max(playedCount, history.length)
  }, [profile, bestScores, history])

  const totalWins = useMemo(() => {
    if (profile?.stats?.wins !== undefined && profile.stats.wins > 0) {
      return profile.stats.wins
    }
    return history.filter((m) => m.result === 'win').length
  }, [profile, history])

  const progression = useMemo(() => {
    if (profile?.progression?.total_xp !== undefined && profile.progression.total_xp > 0) {
      return {
        ...profile.progression,
        current_streak: profile.progression.current_streak || 1,
        longest_streak: profile.progression.longest_streak || 1,
      }
    }

    const scoreXp = bestScores.reduce((acc, b) => acc + Math.floor(b.score / 15), 0)
    const matchXp = history.reduce((acc, m) => acc + (m.result === 'win' ? 35 : 15), 0)
    const baseUpXp = Math.floor(universalPoints * 0.75)
    const estimatedTotalXp = Math.max(baseUpXp + scoreXp + matchXp, 50)

    const snap = calculateProgression(estimatedTotalXp)
    return {
      ...snap,
      current_streak: 1,
      longest_streak: 1,
    }
  }, [profile, universalPoints, bestScores, history])

  const xpPercent = useMemo(() => {
    if (!progression.progress_required) return 0
    return Math.min(100, Math.max(5, Math.round((progression.progress_xp / progression.progress_required) * 100)))
  }, [progression])

  const displayName = player?.display_name || player?.name || 'Player'
  const avatarEmoji = player?.avatar || 'shree-ganesha'
  const campus = player?.campus || 'Online Arena'
  const rating = profile?.player?.rating ?? player?.rating ?? 1000
  const colorIndex = (displayName.charCodeAt(0) || 0) % AVATAR_COLORS.length
  const playerTitle = getTitleForLevel(progression.level, rankTier.name)

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.unlocked).length
  }, [achievements])

  const handleSelectAvatar = async (chosenAvatar) => {
    setShowAvatarPicker(false)
    const meta = getAvatarMeta(chosenAvatar)
    const updated = { ...player, avatar: chosenAvatar }
    setPlayerState(updated)
    savePlayerToStorage(updated)
    onPlayerSetup?.(updated)
    showToast(`Sacred Insignia updated to ${meta.name}!`)

    if (playerId) {
      try {
        await updatePlayerAvatar(playerId, chosenAvatar)
      } catch (e) {
        console.warn('Avatar sync error:', e)
      }
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 88px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: 'var(--text-muted)',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: '3rem' }}
        >
          🪔
        </motion.div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Summoning Player Profile...
        </div>
      </div>
    )
  }

  if (!playerId) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 88px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div
          style={{
            ...cardStyle,
            maxWidth: 460,
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem 1.8rem',
            border: '1.5px solid var(--festival-gold)',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🪔</div>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)' }}>
            Guest Arena Profile
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            You are playing in Guest Mode. Set up your player profile to level up, unlock festival badges, and climb the Global Universal Leaderboard!
          </p>
          <button
            onClick={() => navigate('/player')}
            style={{
              width: '100%',
              padding: '1rem 1.8rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--festival-saffron, #FF6B35), var(--festival-gold, #FFD700))',
              border: 'none',
              color: '#1a0800',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              letterSpacing: 1,
              boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)',
            }}
          >
            CLAIM YOUR PROFILE
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 88px)',
        padding: '1rem 1rem 3rem',
        fontFamily: 'var(--font-sans, system-ui)',
      }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: 'rgba(20, 10, 30, 0.95)',
              border: '1.5px solid var(--festival-gold, #FFD700)',
              color: 'var(--text)',
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={16} color="var(--festival-gold)" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerAnim}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: 640,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Top Bar Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.button
            variants={itemAnim}
            whileHover={{ x: -3 }}
            onClick={() => navigate('/games')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={16} /> Arcade Hub
          </motion.button>

          <motion.button
            variants={itemAnim}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--secondary, #FFD700)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Syncing...' : 'Sync'}
          </motion.button>
        </div>

        {/* 1. Hero Player Identity Card */}
        <motion.div
          variants={itemAnim}
          style={{
            ...cardStyle,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '24px 20px 20px',
            background: 'radial-gradient(ellipse at top, rgba(255, 107, 53, 0.18) 0%, rgba(15, 8, 30, 0.95) 75%)',
            border: '1.5px solid rgba(255, 215, 0, 0.25)',
          }}
        >
          {/* Avatar with Click-to-Edit */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Click to change insignia"
            >
              <PlayerAvatar
                avatar={avatarEmoji}
                size={92}
                showGlow
                tierColor={rankTier.color}
              />
            </motion.div>

            {/* Edit Avatar Pencil Badge */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--festival-gold, #FFD700)',
                border: '2px solid #0f081e',
                color: '#1a0800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
              title="Change Sacred Insignia"
            >
              <Edit3 size={13} strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Avatar Picker Modal / Drawer */}
          <AnimatePresence>
            {showAvatarPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                style={{
                  background: 'rgba(18, 10, 35, 0.98)',
                  border: '1.5px solid var(--festival-gold, #FFD700)',
                  borderRadius: 'var(--radius-xl, 16px)',
                  padding: '16px',
                  marginBottom: 16,
                  width: '100%',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--festival-gold)', display: 'block' }}>
                      SACRED INSIGNIA GALLERY
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Level up to unlock divine festive emblems
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAvatarPicker(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                  }}
                >
                  {AVATAR_LIST.map((item) => {
                    const resolvedCurrent = resolveAvatarId(avatarEmoji)
                    const isSelected = resolvedCurrent === item.id
                    const isLocked = (progression.level || 1) < (item.unlockLevel || 1)

                    return (
                      <motion.button
                        key={item.id}
                        whileHover={!isLocked ? { scale: 1.08 } : {}}
                        whileTap={!isLocked ? { scale: 0.94 } : {}}
                        onClick={() => {
                          if (isLocked) {
                            showToast(`Unlocks at Level ${item.unlockLevel}! Earn XP to level up.`)
                          } else {
                            handleSelectAvatar(item.id)
                          }
                        }}
                        style={{
                          background: isSelected
                            ? 'rgba(255, 215, 0, 0.22)'
                            : isLocked
                              ? 'rgba(255, 255, 255, 0.02)'
                              : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected
                            ? '2px solid var(--festival-gold)'
                            : isLocked
                              ? '1px solid rgba(255, 255, 255, 0.06)'
                              : '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 'var(--radius-md, 12px)',
                          padding: '8px 4px 6px',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          position: 'relative',
                          opacity: isLocked ? 0.5 : 1,
                        }}
                        title={isLocked ? `Unlocks at Level ${item.unlockLevel}` : `${item.name} (${item.title})`}
                      >
                        <PlayerAvatar avatar={item.id} size={42} showGlow={isSelected} />
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: isSelected ? '#FFD700' : isLocked ? 'var(--text-muted)' : '#FFF',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            display: 'block',
                          }}
                        >
                          {item.name}
                        </span>

                        {isLocked && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              background: 'rgba(0,0,0,0.75)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '9999px',
                              padding: '1px 5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              fontSize: '0.58rem',
                              color: '#FBBF24',
                              fontWeight: 800,
                            }}
                          >
                            <Lock size={9} /> Lv.{item.unlockLevel}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name & Campus */}
          <h1
            style={{
              margin: '0 0 4px',
              fontFamily: 'var(--font-display, Poppins, sans-serif)',
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              fontWeight: 900,
              color: 'var(--text)',
            }}
          >
            {displayName}
          </h1>

          <div
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            🏛️ {campus}
          </div>

          {/* Dynamic Prestige Title Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              color: 'var(--festival-gold, #FFD700)',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            <Sparkles size={13} color="var(--festival-gold)" />
            {playerTitle}
          </div>

          {/* 2. Dynamic Level & XP Progress Bar */}
          <div
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '12px 14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: 'var(--festival-saffron, #FF6B35)',
                    textShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
                  }}
                >
                  LEVEL {progression.level}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ({progression.total_xp.toLocaleString()} Total XP)
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--festival-gold, #FFD700)',
                }}
              >
                {progression.progress_xp} / {progression.progress_required} XP ({xpPercent}%)
              </div>
            </div>

            {/* Glowing Progress Track */}
            <div
              style={{
                width: '100%',
                height: 10,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(90deg, #FF6B35 0%, #FFD700 100%)',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.6)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>Current: Lv.{progression.level}</span>
              <span>Next: Lv.{progression.level + 1} (+{progression.progress_required - progression.progress_xp} XP to level up)</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Competitive Global Standing Card */}
        <motion.div
          variants={itemAnim}
          style={{
            ...cardStyle,
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 107, 53, 0.15) 100%)',
            border: `1.5px solid ${rankTier.border || 'rgba(255, 215, 0, 0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: rankTier.glow || 'none',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Crown size={18} color="var(--festival-gold, #FFD700)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Competitive Global Standing
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: '#FFF' }}>
                #{globalRank}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: rankTier.color,
                  background: rankTier.bg,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: `1px solid ${rankTier.border}`,
                  textTransform: 'uppercase',
                }}
              >
                {rankTier.badge} {rankTier.name}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Universal Points
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: rankTier.color }}>
              {universalPoints.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#FFD700' }}>UP</span>
            </div>
            <button
              onClick={() => navigate('/leaderboard')}
              style={{
                marginTop: 4,
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--secondary, #FFD700)',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: 'var(--radius-sm, 6px)',
                cursor: 'pointer',
              }}
            >
              Leaderboard &#8594;
            </button>
          </div>
        </motion.div>

        {/* 4. Core Activity Metrics (Games, Wins, Badges, ELO) */}
        <motion.div
          variants={itemAnim}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {[
            { label: 'Games', value: totalGamesPlayed, icon: Gamepad2, color: 'var(--festival-gold)' },
            { label: 'Wins', value: totalWins, icon: Trophy, color: 'var(--success)' },
            { label: 'Badges', value: `${unlockedCount}/${achievements.length || 12}`, icon: Award, color: '#38BDF8' },
            { label: 'Rating', value: rating, icon: Zap, color: '#EC4899' },
          ].map((s) => (
            <div key={s.label} style={{ ...cardStyle, textAlign: 'center', padding: '12px 6px' }}>
              <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                <s.icon size={22} color={s.color} />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* 5. Working Streaks & Devotion Tracker */}
        <motion.div variants={itemAnim} style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span>🔥 Streaks & Daily Devotion</span>
            <Link
              to="/daily-challenge"
              style={{
                fontSize: '0.72rem',
                color: 'var(--festival-gold)',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Play Daily Challenge &#8594;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 107, 53, 0.08)', borderRadius: 'var(--radius-lg)', padding: '12px 8px' }}>
              <Flame size={24} color="#FF6B35" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: '#FF6B35' }}>
                {progression.current_streak}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Day Streak
              </div>
            </div>

            <div style={{ background: 'rgba(255, 215, 0, 0.08)', borderRadius: 'var(--radius-lg)', padding: '12px 8px' }}>
              <Star size={24} color="#FFD700" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: '#FFD700' }}>
                {progression.longest_streak}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Best Streak
              </div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-lg)', padding: '12px 8px' }}>
              <Calendar size={24} color="#38BDF8" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: '#38BDF8' }}>
                {profile?.stats?.daily_challenges_completed || 1}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Daily Done
              </div>
            </div>
          </div>
        </motion.div>

        {/* 6. Working Achievements Gallery with Detail Modal */}
        <motion.div variants={itemAnim}>
          <div style={sectionTitleStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🎖️ Festival Badges</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--festival-gold)',
                  background: 'rgba(255, 215, 0, 0.12)',
                  padding: '1px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {unlockedCount} / {achievements.length || 12}
              </span>
            </div>
            <Link
              to="/achievements"
              style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}
            >
              View Full &#8594;
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 10,
            }}
          >
            {achievements.map((a, i) => {
              const isUnlocked = a.unlocked
              return (
                <motion.div
                  key={a.id || i}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedAchievement(a)}
                  style={{
                    ...cardStyle,
                    padding: '12px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    border: isUnlocked
                      ? '1.5px solid rgba(255, 215, 0, 0.45)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isUnlocked
                      ? 'radial-gradient(ellipse at top, rgba(255, 215, 0, 0.15) 0%, rgba(20, 10, 35, 0.9) 80%)'
                      : 'rgba(15, 8, 25, 0.6)',
                    opacity: isUnlocked ? 1 : 0.6,
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.8rem',
                      marginBottom: 6,
                      filter: isUnlocked ? 'none' : 'grayscale(1)',
                    }}
                  >
                    {a.icon || '🎖️'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isUnlocked ? 'var(--festival-gold)' : 'var(--text-muted)',
                      marginBottom: 4,
                      lineHeight: 1.2,
                    }}
                  >
                    {a.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: isUnlocked ? 'var(--success)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                  >
                    {isUnlocked ? <Check size={11} strokeWidth={3} /> : <Lock size={10} />}
                    {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Achievement Detail Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
              }}
              onClick={() => setSelectedAchievement(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  ...cardStyle,
                  maxWidth: 380,
                  width: '100%',
                  textAlign: 'center',
                  padding: '24px',
                  border: selectedAchievement.unlocked
                    ? '2px solid var(--festival-gold)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>
                  {selectedAchievement.icon || '🎖️'}
                </div>
                <h3
                  style={{
                    margin: '0 0 6px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    color: selectedAchievement.unlocked ? 'var(--festival-gold)' : 'var(--text)',
                  }}
                >
                  {selectedAchievement.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 16px' }}>
                  {selectedAchievement.description}
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: selectedAchievement.unlocked ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: selectedAchievement.unlocked ? 'var(--success)' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    marginBottom: 16,
                  }}
                >
                  {selectedAchievement.unlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                </div>

                <button
                  onClick={() => setSelectedAchievement(null)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7. Working Best Scores with 1-Tap Play */}
        <motion.div variants={itemAnim}>
          <div style={sectionTitleStyle}>
            <span>🏆 Best Scores per Game</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Tap Play to Beat Record
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 10,
            }}
          >
            {bestScores.map((g) => (
              <div
                key={g.id}
                style={{
                  ...cardStyle,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md, 8px)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      flexShrink: 0,
                    }}
                  >
                    {g.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                      }}
                    >
                      {g.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        color: 'var(--festival-gold)',
                      }}
                    >
                      {g.score.toLocaleString()}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(g.route)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255, 107, 53, 0.2)',
                    border: '1px solid rgba(255, 107, 53, 0.4)',
                    color: 'var(--festival-saffron)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title={`Play ${g.name}`}
                >
                  <Play size={13} fill="currentColor" />
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 8. Working Match History */}
        <motion.div variants={itemAnim}>
          <div style={sectionTitleStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Swords size={16} color="var(--secondary)" />
              <span>Recent Multiplayer Matches</span>
            </div>
            <Link
              to="/multiplayer/history"
              style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}
            >
              All Matches &#8594;
            </Link>
          </div>

          {history.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                textAlign: 'center',
                padding: '24px 16px',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚔️</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                No Multiplayer Battles Yet
              </div>
              <p style={{ fontSize: '0.8rem', margin: '0 0 16px' }}>
                Challenge friends in a private room or test your skills in live Quick Match!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button
                  onClick={() => navigate('/multiplayer/quick-match')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--festival-saffron)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Quick Match
                </button>
                <button
                  onClick={() => navigate('/multiplayer/friend')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  🤝 Friend Room
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.slice(0, 5).map((match, i) => {
                const isWin = match.result === 'win'
                const isLoss = match.result === 'loss'
                const ratingDiff = match.rating_change ?? (match.rating_after - match.rating_before) ?? 0

                return (
                  <div
                    key={match.match_id || i}
                    style={{
                      ...cardStyle,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderLeft: `4px solid ${isWin ? 'var(--success)' : isLoss ? 'var(--danger)' : 'var(--text-muted)'}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        vs {match.opponent_name || 'Opponent'}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {match.mode === 'friend_room' ? 'Friend' : 'Quick'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        Score: {match.my_score || 0} - {match.opponent_score || 0}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: ratingDiff >= 0 ? 'var(--success)' : 'var(--danger)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {ratingDiff >= 0 ? '+' : ''}{ratingDiff}
                      </span>

                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: isWin ? 'var(--success)' : isLoss ? 'var(--danger)' : 'var(--text-muted)',
                          background: isWin
                            ? 'rgba(46, 204, 113, 0.15)'
                            : isLoss
                            ? 'rgba(231, 76, 60, 0.15)'
                            : 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 'var(--radius-md)',
                          padding: '3px 10px',
                          minWidth: 36,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isWin ? 'WIN' : isLoss ? 'LOSS' : 'DRAW'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* 9. Switch Profile / Account Action */}
        <motion.div variants={itemAnim} style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => navigate('/player')}
            style={{
              padding: '0.7rem 1.6rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Switch Account / Log In to Another Profile
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
