import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Trophy, User, LogOut, Home, Gamepad2, Info, Swords, Flame } from 'lucide-react'
import { getProgression } from '../services/api'

export default function Navbar({ player, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [progression, setProgression] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    if (!player?.id) {
      setProgression(null)
      return
    }
    getProgression(player.id)
      .then((data) => { if (!cancelled) setProgression(data) })
      .catch(() => { if (!cancelled) setProgression(null) })
    return () => { cancelled = true }
  }, [player?.id])

  const toggleMobile = () => setMobileOpen((v) => !v)

  const handleLogout = () => {
    onLogout?.()
    setMobileOpen(false)
    navigate('/')
  }

  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path))

  const xpPercent = progression?.progress_required
    ? Math.min(100, Math.round((progression.progress_xp / progression.progress_required) * 100))
    : 0

  const bottomLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/games', icon: Gamepad2, label: 'Games' },
    { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
    { to: '/daily-challenge', icon: Flame, label: 'Daily' },
    { to: player ? '/profile' : '/player', icon: User, label: 'You' },
  ]

  return (
    <>
      <nav className="navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <span className="brand-icon">🪔</span>
          <span className="brand-text">GANPATI BLITZ</span>
        </Link>

        <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Home size={15} />
            Home
          </Link>
          <Link to="/games" className={`navbar-link ${isActive('/games') ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Gamepad2 size={15} />
            Games
          </Link>
          <Link to="/daily-challenge" className={`navbar-link ${isActive('/daily-challenge') ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame size={15} />
            Daily
          </Link>
          <Link to="/leaderboard" className={`navbar-link ${isActive('/leaderboard') ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Trophy size={15} />
            Leaderboard
          </Link>
          <Link to="/multiplayer" className={`navbar-link ${isActive('/multiplayer') ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Swords size={15} />
            Multiplayer
          </Link>
          <Link to="/how-to-play" className={`navbar-link ${isActive('/how-to-play') ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Info size={15} />
            Help
          </Link>

          {player ? (
            <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.5rem' }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--festival-saffron), var(--festival-gold))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: '#2a1500', fontSize: '0.85rem',
                    border: '2px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 0 12px rgba(255,153,51,0.4)',
                    flexShrink: 0,
                  }}
                >
                  {player.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="navbar-username" style={{ lineHeight: 1 }}>
                    {player.display_name}
                    {progression?.level != null && (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · Lv{progression.level}</span>
                    )}
                  </span>
                  {progression?.progress_required ? (
                    <div className="navbar-xp-track" aria-label={`${xpPercent}% to next level`}>
                      <div className="navbar-xp-fill" style={{ width: `${xpPercent}%` }} />
                    </div>
                  ) : null}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-secondary"
                aria-label="Log out"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.4rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  minHeight: 'auto',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link to="/player" className="btn btn-sm btn-primary" style={{ marginLeft: '0.5rem', textDecoration: 'none' }}>
              <Gamepad2 size={15} />
              Join
            </Link>
          )}
        </div>

        <button
          onClick={toggleMobile}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            transition: 'background var(--transition-fast)',
          }}
          className="navbar-hamburger"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{
                position: 'fixed',
                top: '68px',
                left: '0.5rem',
                right: '0.5rem',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                zIndex: 999,
                boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
              }}
            >
              {[
                { to: '/', icon: Home, label: 'Home' },
                { to: '/games', icon: Gamepad2, label: 'Arcade' },
                { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
                { to: '/multiplayer', icon: Swords, label: 'Multiplayer' },
                { to: '/how-to-play', icon: Info, label: 'How to Play' },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    color: isActive(to) ? 'var(--festival-gold)' : 'var(--text-muted)',
                    background: isActive(to) ? 'rgba(255,209,102,0.1)' : 'transparent',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />

              {player ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                    <User size={18} style={{ color: 'var(--secondary)' }} />
                    <Link to="/profile" onClick={() => setMobileOpen(false)} style={{ color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none' }}>{player.display_name}</Link>
                    <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>{player.campus}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      color: 'var(--danger)',
                      borderRadius: 'var(--radius-md)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/player"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary"
                  style={{ justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Gamepad2 size={18} />
                  Join Now
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          .navbar-hamburger { display: none !important; }
          @media (max-width: 768px) {
            .navbar-hamburger { display: flex !important; }
            .navbar-links { display: none !important; }
          }
        `}</style>
      </nav>

      {/* Game-style bottom navigation for mobile */}
      <nav className="bottom-nav" aria-label="Primary">
        {bottomLinks.map(({ to, icon: Icon, label }) => {
          const active = isActive(to)
          return (
            <Link key={to} to={to} className={`bottom-nav-link ${active ? 'active' : ''}`}>
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
