import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2,
  Trophy,
  Flame,
  Crown,
  User,
  Settings as SettingsIcon,
  Menu,
  X,
  Home as HomeIcon,
  Volume2,
  VolumeX,
  Swords,
  UserPlus,
  LogIn,
} from 'lucide-react'
import { LogoIcon } from './Logo'
import { getRankTier } from '../config/universalPoints'
import { calculateProgression } from '../utils/progression'
import PlayerAvatar from './PlayerAvatar'

export default function TopNav({ player, soundEnabled, onSoundToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [universalPoints, setUniversalPoints] = useState(() => {
    const localUP = parseInt(localStorage.getItem('ganpati_universal_points') || '0', 10)
    return Math.max(localUP, Number(player?.universal_points || 0))
  })

  // Sync UP reactively from storage, custom events, or player prop
  useEffect(() => {
    const syncUP = () => {
      const localUP = parseInt(localStorage.getItem('ganpati_universal_points') || '0', 10)
      const storedPlayer = JSON.parse(localStorage.getItem('ganpati_player') || 'null')
      const effective = Math.max(localUP, Number(storedPlayer?.universal_points || 0), Number(player?.universal_points || 0))
      setUniversalPoints(effective)
    }

    syncUP()

    const onPointsUpdated = (e) => {
      if (e.detail?.universal_points !== undefined) {
        setUniversalPoints((prev) => Math.max(prev, Number(e.detail.universal_points)))
      } else {
        syncUP()
      }
    }

    const onPlayerUpdated = (e) => {
      if (e.detail?.player?.universal_points !== undefined) {
        setUniversalPoints((prev) => Math.max(prev, Number(e.detail.player.universal_points)))
      } else {
        syncUP()
      }
    }

    window.addEventListener('ganpati_points_updated', onPointsUpdated)
    window.addEventListener('ganpati_player_updated', onPlayerUpdated)
    window.addEventListener('storage', syncUP)

    return () => {
      window.removeEventListener('ganpati_points_updated', onPointsUpdated)
      window.removeEventListener('ganpati_player_updated', onPlayerUpdated)
      window.removeEventListener('storage', syncUP)
    }
  }, [location.pathname, player?.universal_points])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Detect active gameplay routes to hide TopNav during games
  const pathname = location.pathname
  const isGameplayRoute =
    pathname === '/multiplayer/game' ||
    (/^\/game\/(modak-rush|diya-dash|dhol-battle|rangoli-rush|mushak-maze|ganpati-logic)$/.test(pathname) &&
      !pathname.includes('/mode') &&
      !pathname.includes('/difficulty') &&
      !pathname.includes('/instructions'))

  const currentUP = Math.max(Number(player?.universal_points || 0), Number(universalPoints || 0))
  const tier = getRankTier(currentUP)

  // Compute live level and XP progress (must be called before any early return)
  const progression = useMemo(() => {
    if (player?.progression?.level) {
      return player.progression
    }
    const xp = player?.total_xp || player?.xp || Math.max(currentUP, 50)
    return calculateProgression(xp)
  }, [player, currentUP])

  if (isGameplayRoute) {
    return null
  }

  const isPlayActive =
    pathname === '/games' ||
    pathname.startsWith('/game/') ||
    pathname.startsWith('/blitz-mix')

  const isLeaderboardActive = pathname === '/leaderboard'
  const isDailyActive = pathname === '/daily-challenge'

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Left: Logo & optional compact Home button */}
        <div style={styles.left}>
          <Link to="/" style={styles.brandLink}>
            <div style={styles.logoWrapper}>
              <LogoIcon size={26} />
            </div>
            <span style={styles.brandText} className="brand-title-text">GANPATI BLITZ</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate('/')}
            title="Return to Home"
            style={{
              ...styles.homeBtn,
              background: pathname === '/' ? 'rgba(255, 209, 102, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: pathname === '/' ? '#FFD166' : 'var(--text-muted, #9CA3AF)',
            }}
            aria-label="Home"
          >
            <HomeIcon size={16} />
          </button>
        </div>

        {/* Center: Main Navigation (Desktop) */}
        <nav style={styles.centerNav} className="desktop-nav">
          <Link
            to="/games"
            style={{
              ...styles.navItem,
              ...(isPlayActive ? styles.navItemActive : {}),
            }}
          >
            <Gamepad2 size={16} />
            <span>Play</span>
          </Link>

          <Link
            to="/leaderboard"
            style={{
              ...styles.navItem,
              ...(isLeaderboardActive ? styles.navItemActive : {}),
            }}
          >
            <Trophy size={16} />
            <span>Leaderboard</span>
          </Link>

          <Link
            to="/daily-challenge"
            style={{
              ...styles.navItem,
              ...(isDailyActive ? styles.navItemActive : {}),
            }}
          >
            <Flame size={16} />
            <span>Daily Challenge</span>
          </Link>
        </nav>

        {/* Right: Player Stats & Quick Links (Desktop) */}
        <div style={styles.right} className="desktop-right">
          {/* Universal Points Badge */}
          <Link
            to="/leaderboard"
            title={`Universal Points: ${currentUP.toLocaleString()} UP (${tier.name})`}
            style={{
              ...styles.upBadge,
              background: tier.bg || 'rgba(255, 215, 0, 0.1)',
              borderColor: tier.color || '#FFD700',
            }}
          >
            <Crown size={14} color={tier.color || '#FFD700'} />
            <span style={{ ...styles.upText, color: tier.color || '#FFD700' }}>
              {currentUP.toLocaleString()} <span style={{ fontSize: '0.65rem' }}>UP</span>
            </span>
          </Link>

          {/* XP & Level Badge */}
          {player || currentUP > 0 ? (
            <div
              style={styles.levelBadge}
              title={`Level ${progression.level} (${progression.progress_xp}/${progression.progress_required} XP)`}
            >
              <span style={styles.levelText}>Lv.{progression.level}</span>
              <div style={styles.xpBarBg}>
                <div
                  style={{
                    ...styles.xpBarFill,
                    width: `${Math.min(100, Math.max(8, Math.round((progression.progress_xp / Math.max(1, progression.progress_required)) * 100)))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <Link
              to="/player"
              title="Create Account or Log In"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.42rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FFD166 100%)',
                color: '#1a0800',
                fontWeight: 800,
                fontSize: '0.8rem',
                letterSpacing: '0.02em',
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(255, 107, 53, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              <UserPlus size={14} /> Log In / Register
            </Link>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onSoundToggle}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            style={styles.iconBtn}
            aria-label="Sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Profile */}
          <Link
            to="/profile"
            title={player ? `${player.display_name || 'Player'} Profile` : 'Player Profile'}
            style={{
              ...styles.iconBtn,
              padding: player ? 2 : undefined,
              color: pathname === '/profile' ? '#FFD166' : 'var(--text)',
              borderColor: pathname === '/profile' ? 'rgba(255,209,102,0.4)' : 'rgba(255,255,255,0.1)',
            }}
            aria-label="Profile"
          >
            {player ? (
              <PlayerAvatar avatar={player.avatar} size={28} showGlow={pathname === '/profile'} />
            ) : (
              <User size={16} />
            )}
          </Link>

          {/* Settings */}
          <Link
            to="/settings"
            title="Settings"
            style={{
              ...styles.iconBtn,
              color: pathname === '/settings' ? '#FFD166' : 'var(--text)',
              borderColor: pathname === '/settings' ? 'rgba(255,209,102,0.4)' : 'rgba(255,255,255,0.1)',
            }}
            aria-label="Settings"
          >
            <SettingsIcon size={16} />
          </Link>
        </div>

        {/* Mobile: Quick Leaderboard + Quick Play + Hamburger Button */}
        <div style={styles.mobileRight} className="mobile-only">
          <Link
            to="/leaderboard"
            style={{
              ...styles.mobileLeaderboardBtn,
              ...(isLeaderboardActive ? styles.mobileLeaderboardBtnActive : {}),
            }}
            className="topbar-leaderboard-btn"
            title="Global Universal Leaderboard"
            aria-label="Leaderboard"
          >
            <Trophy size={14} className="trophy-nav-icon" />
            <span className="mobile-lb-text-full">Leaderboard</span>
            <span className="mobile-lb-text-short">Ranks</span>
          </Link>

          <Link to="/games" style={styles.mobilePlayBtn} className="topbar-play-btn">
            <Gamepad2 size={14} /> <span>Play</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.hamburgerBtn}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={styles.mobileMenu}
          >
            {/* Player quick info in mobile drawer */}
            {player ? (
              <div style={styles.mobilePlayerCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <PlayerAvatar avatar={player.avatar} size={32} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FFF' }}>
                      {player.display_name || player.name || 'Player'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {player.campus || 'Campus Blitzer'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: tier.bg,
                      border: `1px solid ${tier.border}`,
                      color: tier.color,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    {currentUP.toLocaleString()} UP
                  </div>
                  <div
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    Lv.{progression.level}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.mobilePlayerCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🪔</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FFF' }}>
                      Guest Blitzer
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Log in to save rankings
                    </div>
                  </div>
                </div>

                <Link
                  to="/player"
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
                    color: '#1a0800',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Log In / Join
                </Link>
              </div>
            )}

            {/* Mobile Nav Links */}
            <div style={styles.mobileLinksList}>
              <Link
                to="/games"
                style={{
                  ...styles.mobileLink,
                  ...(isPlayActive ? styles.mobileLinkActive : {}),
                }}
              >
                <Gamepad2 size={18} color="#FFD166" />
                <span>Play Games (Game Hub)</span>
              </Link>

              <Link
                to="/leaderboard"
                style={{
                  ...styles.mobileLink,
                  ...(isLeaderboardActive ? styles.mobileLinkActive : {}),
                }}
              >
                <Trophy size={18} color="#FBBF24" />
                <span>Global Universal Leaderboard</span>
              </Link>

              <Link
                to="/daily-challenge"
                style={{
                  ...styles.mobileLink,
                  ...(isDailyActive ? styles.mobileLinkActive : {}),
                }}
              >
                <Flame size={18} color="#FF5E3A" />
                <span>Daily Challenge</span>
              </Link>

              <Link
                to="/multiplayer"
                style={{
                  ...styles.mobileLink,
                  ...(pathname.startsWith('/multiplayer') ? styles.mobileLinkActive : {}),
                }}
              >
                <Swords size={18} color="#38BDF8" />
                <span>Play with Friends (Multiplayer)</span>
              </Link>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Link
                  to="/profile"
                  style={{
                    ...styles.mobileSubLink,
                    color: pathname === '/profile' ? '#FFD166' : 'var(--text)',
                  }}
                >
                  <User size={15} /> Profile
                </Link>

                <Link
                  to="/settings"
                  style={{
                    ...styles.mobileSubLink,
                    color: pathname === '/settings' ? '#FFD166' : 'var(--text)',
                  }}
                >
                  <SettingsIcon size={15} /> Settings
                </Link>

                <Link
                  to="/player"
                  style={{
                    ...styles.mobileSubLink,
                    gridColumn: 'span 2',
                    color: '#FFD700',
                    background: 'rgba(255,215,0,0.06)',
                    borderColor: 'rgba(255,215,0,0.2)',
                  }}
                >
                  <User size={15} /> {player ? 'Switch Account / Profile' : 'Log In or Register'}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 820px) {
          .desktop-nav { display: none !important; }
          .desktop-right { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 821px) {
          .desktop-nav { display: flex !important; }
          .desktop-right { display: flex !important; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 440px) {
          .mobile-lb-text-full { display: none !important; }
          .mobile-lb-text-short { display: inline !important; }
        }
        @media (min-width: 441px) {
          .mobile-lb-text-full { display: inline !important; }
          .mobile-lb-text-short { display: none !important; }
        }
        @media (max-width: 360px) {
          .brand-title-text { font-size: 0.76rem !important; }
          .topbar-leaderboard-btn { padding: 0.3rem 0.5rem !important; font-size: 0.72rem !important; }
          .topbar-play-btn { padding: 0.3rem 0.55rem !important; font-size: 0.72rem !important; }
        }
        .topbar-leaderboard-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 209, 102, 0.7) !important;
          box-shadow: 0 4px 14px rgba(255, 209, 102, 0.3) !important;
        }
        .trophy-nav-icon {
          animation: trophyGlow 3s ease-in-out infinite;
        }
        @keyframes trophyGlow {
          0%, 100% { filter: drop-shadow(0 0 0px transparent); }
          50% { filter: drop-shadow(0 0 4px rgba(255, 209, 102, 0.8)); }
        }
      `}</style>
    </header>
  )
}

const styles = {
  header: {
    position: 'fixed',
    top: 8,
    left: 10,
    right: 10,
    maxWidth: 1040,
    margin: '0 auto',
    zIndex: 1000,
  },
  container: {
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    background: 'rgba(12, 8, 28, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 209, 102, 0.22)',
    borderRadius: 'var(--radius-xl, 18px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.45), 0 0 14px rgba(255,209,102,0.06)',
    boxSizing: 'border-box',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    userSelect: 'none',
  },
  logoWrapper: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandText: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontWeight: 900,
    fontSize: '0.86rem',
    letterSpacing: '0.06em',
    background: 'linear-gradient(135deg, var(--festival-gold, #FFD166), var(--festival-saffron, #FF8C42))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  homeBtn: {
    width: 30,
    height: 30,
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  centerNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  navItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0.35rem 0.85rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-muted, #9CA3AF)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    color: '#FFD166',
    background: 'rgba(255, 209, 102, 0.14)',
    border: '1px solid rgba(255, 209, 102, 0.3)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  upBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '0.28rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    textDecoration: 'none',
    transition: 'transform 0.15s ease',
  },
  upText: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
  levelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 'var(--radius-full)',
    padding: '0.25rem 0.65rem',
  },
  levelText: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#FFF',
    fontFamily: 'var(--font-mono, monospace)',
  },
  xpBarBg: {
    width: 32,
    height: 4,
    borderRadius: 2,
    background: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #FFD166, #FF8C42)',
    borderRadius: 2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text, #EAEAEA)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  mobileRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  mobileLeaderboardBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '0.34rem 0.65rem',
    borderRadius: 'var(--radius-full, 9999px)',
    background: 'linear-gradient(135deg, rgba(255, 209, 102, 0.16) 0%, rgba(255, 140, 66, 0.2) 100%)',
    border: '1.5px solid rgba(255, 209, 102, 0.45)',
    color: '#FFD166',
    fontSize: '0.78rem',
    fontWeight: 800,
    textDecoration: 'none',
    boxShadow: '0 2px 10px rgba(255, 209, 102, 0.18)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
  mobileLeaderboardBtnActive: {
    background: 'linear-gradient(135deg, #FFD166 0%, #FF8C42 100%)',
    color: '#0C081C',
    borderColor: '#FFD166',
    boxShadow: '0 2px 14px rgba(255, 209, 102, 0.5)',
  },
  mobilePlayBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '0.34rem 0.72rem',
    borderRadius: 'var(--radius-full)',
    background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
    color: '#0C081C',
    fontSize: '0.78rem',
    fontWeight: 800,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  hamburgerBtn: {
    width: 34,
    height: 34,
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  mobileMenu: {
    marginTop: 6,
    background: 'rgba(12, 8, 28, 0.98)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 209, 102, 0.25)',
    borderRadius: 'var(--radius-xl, 18px)',
    padding: '1rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    overflow: 'hidden',
  },
  mobilePlayerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 'var(--radius-lg, 12px)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  mobileLinksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  mobileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.85rem',
    borderRadius: 'var(--radius-md, 10px)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: '#F3F4F6',
    fontSize: '0.9rem',
    fontWeight: 700,
    textDecoration: 'none',
  },
  mobileLinkActive: {
    background: 'rgba(255, 209, 102, 0.12)',
    border: '1px solid rgba(255, 209, 102, 0.35)',
    color: '#FFD166',
  },
  mobileSubLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.55rem',
    borderRadius: 'var(--radius-md, 8px)',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    fontSize: '0.82rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
}
