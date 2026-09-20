import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getPlayer } from '../utils/storage'
import { Trophy, Flame, Star, Award, Gamepad2, Calendar, Crown } from 'lucide-react'
import { getRankTier } from '../config/universalPoints'

const GAME_LIST = [
  { id: 'modak-rush', name: 'Modak Rush' },
  { id: 'diya-dash', name: 'Diya Dash' },
  { id: 'dhol-battle', name: 'Dhol Battle' },
  { id: 'rangoli-rush', name: 'Rangoli Rush' },
  { id: 'mushak-maze', name: 'Mushak Maze' },
  { id: 'ganpati-logic', name: 'Ganpati Logic' },
]

const GAME_ICONS = {
  'modak-rush': '🥟',
  'diya-dash': '🪔',
  'dhol-battle': '🥁',
  'rangoli-rush': '🎨',
  'mushak-maze': '🐭',
  'ganpati-logic': '🧩',
}

const AVATAR_COLORS = [
  '#FF6B35', '#FFD700', '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C',
]

const cardStyle = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px 16px',
}

const sectionTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const containerAnim = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const player = getPlayer()
  const playerId = player?.id || player?.player_id || ''

  const [profile, setProfile] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) {
      setLoading(false)
      return
    }
    const fetchData = async () => {
      try {
        const [profileRes, achievementsRes, historyRes] = await Promise.allSettled([
          fetch(API + '/api/profile/' + playerId),
          fetch(API + '/api/achievements/' + playerId),
          fetch(API + '/api/matches/history/' + playerId),
        ])
        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          setProfile(await profileRes.value.json())
        }
        if (achievementsRes.status === 'fulfilled' && achievementsRes.value.ok) {
          const data = await achievementsRes.value.json()
          setAchievements(data.achievements || [])
        }
        if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
          const data = await historyRes.value.json()
          setHistory(data.history || [])
        }
      } catch (_) {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [playerId])

  const displayName = player?.name || player?.display_name || 'Player'
  const avatarEmoji = player?.avatar || '\u{1FAB7}'
  const campus = player?.campus || ''
  const level = profile?.level || 1
  const xp = profile?.xp || 0
  const xpNext = profile?.xpNext || 100
  const title = profile?.title || ''
  const rating = profile?.rating || 0
  const gamesPlayed = profile?.gamesPlayed || 0
  const wins = profile?.wins || 0
  const totalAchievements = achievements.length
  const unlockedAchievements = achievements.filter(function (a) { return a.unlocked }).length
  const xpPercent = Math.min(100, Math.round((xp / xpNext) * 100))

  const universalPoints = profile?.player?.universal_points ?? profile?.competitive?.universal_points ?? profile?.universalPoints ?? parseInt(localStorage.getItem('ganpati_universal_points') || '0', 10)
  const globalRank = profile?.player?.global_rank ?? profile?.competitive?.global_rank ?? profile?.globalRank ?? '-'
  const rankTier = profile?.player?.rank_tier ?? getRankTier(universalPoints)

  const bestScores = GAME_LIST.map(function (g) {
    const key = 'ganpati_best_' + g.id.replace(/-/g, '_')
    const stored = parseInt(localStorage.getItem(key) || '0', 10)
    return { id: g.id, name: g.name, score: stored }
  })

  const colorIndex = (displayName.charCodeAt(0) || 0) % AVATAR_COLORS.length

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        color: 'var(--text-muted)',
        fontSize: '1.1rem',
      }}>
        Loading profile...
      </div>
    )
  }

  if (!playerId) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}>
        <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🪔</div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>Guest Profile</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            You are currently playing as Guest. Create a player profile or log in to track your scores, climb the universal leaderboard, and unlock festival achievements!
          </p>
          <button
            onClick={() => navigate('/player')}
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
              border: 'none',
              color: '#1a0800',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255,107,53,0.3)',
            }}
          >
            Log In / Create Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '0 0 40px',
      fontFamily: 'var(--font-sans)',
    }}>
      <motion.div
        variants={containerAnim}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: 600,
          margin: '0 auto',
          padding: '16px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <motion.button
          variants={itemAnim}
          whileHover={{ x: -4 }}
          onClick={function () { navigate('/') }}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          &#8592; Back
        </motion.button>

        <motion.div
          variants={itemAnim}
          style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius-full)',
            background: AVATAR_COLORS[colorIndex],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px ' + AVATAR_COLORS[colorIndex] + '44',
            fontSize: '2.2rem',
            fontWeight: 800,
            color: '#fff',
          }}>
            {avatarEmoji || displayName.charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text)',
            }}>
              {displayName}
            </div>
            {campus && (
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginTop: 2,
              }}>
                {campus}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--festival-saffron)',
              whiteSpace: 'nowrap',
            }}>
              Lv.{level}
            </div>
            <div style={{
              flex: 1,
              height: 8,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: xpPercent + '%',
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, var(--festival-saffron), var(--festival-gold))',
              }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              {xp}/{xpNext}
            </div>
          </div>

          {title && (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              color: 'var(--festival-gold)',
              border: '1px solid var(--festival-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 14px',
            }}>
              {title}
            </div>
          )}

          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            color: 'var(--text)',
          }}>
            Rating: {rating}
          </div>
        </motion.div>

        {/* Universal Points & Global Standing Card */}
        <motion.div
          variants={itemAnim}
          style={{
            ...cardStyle,
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 107, 53, 0.15) 100%)',
            border: `1.5px solid ${rankTier.border || 'rgba(255, 215, 0, 0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: rankTier.glow || 'none',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Crown size={18} color="#FFD700" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Competitive Global Standing
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 900, color: '#FFF' }}>
                #{globalRank}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
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
                marginTop: 6,
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--secondary, #FFD700)',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Global Leaderboard &#8594;
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={itemAnim}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {[
            { label: 'Games', value: gamesPlayed, icon: Gamepad2 },
            { label: 'Wins', value: wins, icon: Trophy },
            { label: 'Badges', value: unlockedAchievements, icon: Award },
          ].map(function (s) {
            return (
              <div key={s.label} style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ marginBottom: 4 }}><s.icon size={28} /></div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {s.label}
                </div>
              </div>
            )
          })}
        </motion.div>

        <motion.div variants={itemAnim}>
          <div style={sectionTitle}>BEST SCORES</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
          }}>
            {bestScores.map(function (g) {
              return (
                <div key={g.id} style={{
                  ...cardStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    flexShrink: 0,
                  }}>
                    {GAME_ICONS[g.id] || '🎮'}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}>
                      {g.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--festival-gold)',
                    }}>
                      {g.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={itemAnim}>
          <div style={sectionTitle}>
            ACHIEVEMENTS{' '}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}>
              {unlockedAchievements}/{totalAchievements}
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'thin',
          }}>
            {achievements.length === 0 && (
              <div style={{
                ...cardStyle,
                minWidth: 140,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}>
                No achievements yet
              </div>
            )}
            {achievements.map(function (a, i) {
              return (
                <div
                  key={a.id || i}
                  style={{
                    ...cardStyle,
                    minWidth: 120,
                    textAlign: 'center',
                    opacity: a.unlocked ? 1 : 0.4,
                    filter: a.unlocked ? 'none' : 'grayscale(1)',
                    position: 'relative',
                  }}
                >
                  <div style={{ marginBottom: 6 }}><Trophy size={32} /></div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    lineHeight: 1.2,
                  }}>
                    {a.name || 'Locked'}
                  </div>
                  {!a.unlocked && (
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      fontSize: '0.9rem',
                    }}>
                      Locked
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={itemAnim} style={cardStyle}>
          <div style={sectionTitle}>STREAKS</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Current', value: profile?.currentStreak || 0, icon: Flame },
              { label: 'Longest', value: profile?.longestStreak || 0, icon: Star },
              { label: 'Daily Done', value: profile?.dailyCompleted || 0, icon: Calendar },
            ].map(function (s) {
              return (
                <div key={s.label} style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                  <div style={{ marginBottom: 2 }}><s.icon size={24} /></div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}>
                    {s.label}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={itemAnim}>
          <div style={sectionTitle}>RECENT MATCHES</div>
          {history.length === 0 ? (
            <div style={{
              ...cardStyle,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}>
              No matches played yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.slice(0, 5).map(function (match, i) {
                const isWin = match.result === 'win'
                const isLoss = match.result === 'loss'
                return (
                  <motion.div
                    key={match.id || i}
                    variants={itemAnim}
                    style={{
                      ...cardStyle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text)',
                      }}>
                        vs {match.opponentName || 'Unknown'}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}>
                        {match.score || 0} - {match.opponentScore || 0}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: (match.ratingChange || 0) >= 0 ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {(match.ratingChange || 0) >= 0 ? '+' : ''}{match.ratingChange || 0}
                      </span>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: isWin ? 'var(--success)' : isLoss ? 'var(--danger)' : 'var(--text-muted)',
                        background: isWin
                          ? 'rgba(46,204,113,0.15)'
                          : isLoss
                            ? 'rgba(231,76,60,0.15)'
                            : 'rgba(255,255,255,0.05)',
                        borderRadius: 'var(--radius-md)',
                        padding: '4px 12px',
                        minWidth: 36,
                        textAlign: 'center',
                      }}>
                        {isWin ? 'W' : isLoss ? 'L' : 'D'}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Account Switch Action */}
        <motion.div variants={itemAnim} style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => navigate('/player')}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
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
