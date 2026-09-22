import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { Analytics } from '@vercel/analytics/react'
import SplashScreen from './components/SplashScreen'
import TopNav from './components/TopNav'
import FestiveBackground from './components/FestiveBackground'
import Home from './pages/Home'
import GameHub from './pages/GameHub'
import GameModeScreen from './pages/GameModeScreen'
import DifficultyScreen from './pages/DifficultyScreen'
import GameInstructionsScreen from './pages/GameInstructionsScreen'
import PlayerSetupPage from './pages/PlayerSetupPage'
import Settings from './pages/Settings'
import ProfilePage from './pages/ProfilePage'
import DailyChallenge from './pages/DailyChallenge'
import Achievements from './pages/Achievements'
import ResultScreen from './pages/ResultScreen'
import MultiplayerPage from './pages/MultiplayerPage'
import FriendRoomPage from './pages/FriendRoomPage'
import WaitingRoomPage from './pages/WaitingRoomPage'
import MultiplayerGame from './pages/MultiplayerGame'
import MatchResultPage from './pages/MatchResultPage'
import QuickMatchPage from './pages/QuickMatchPage'
import MatchHistoryPage from './pages/MatchHistoryPage'
import Leaderboard from './pages/Leaderboard'
import ErrorBoundary from './components/ErrorBoundary'
import { getSoundEnabled, setSoundEnabled, setUniversalPoints } from './utils/storage'
import { warmUpBackend } from './services/socket'
import { getProfile } from './services/api'
import { ServerWakeupBanner } from './components/ServerWakeupNotice'
import { useServerHealth, createGuestPlayerIfMissing } from './utils/useServerHealth'

const ModakRush = lazy(() => import('./pages/ModakRush'))
const DiyaDash = lazy(() => import('./games/diyaDash/DiyaDash'))
const DholBattle = lazy(() => import('./games/dholBattle/DholBattle'))
const RangoliRush = lazy(() => import('./games/rangoliRush/RangoliRush'))
const MushakMaze = lazy(() => import('./games/mushakMaze/MushakMaze'))
const GanpatiLogic = lazy(() => import('./games/ganpatiLogic/GanpatiLogic'))
const BlitzMix = lazy(() => import('./pages/BlitzMix'))

function GameLoadingScreen() {
  const [seconds, setSeconds] = useState(0)
  const { countdown, isWakingUp } = useServerHealth()

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const isSlow = seconds >= 4 || isWakingUp

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a1a',
        zIndex: 200,
        flexDirection: 'column',
        gap: '1.2rem',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>🐘</div>
      <div>
        <div style={{ color: '#FFF', fontSize: '1.05rem', fontWeight: 700 }}>
          {isSlow ? 'Starting Game & Syncing Server...' : 'Loading game...'}
        </div>
        {isSlow && (
          <p
            style={{
              color: 'var(--text-muted, #9CA3AF)',
              fontSize: '0.82rem',
              maxWidth: 360,
              margin: '0.4rem auto 0',
              lineHeight: 1.4,
            }}
          >
            Render free tier backend may be waking up from sleep (~50-60s). Please wait or play offline.
          </p>
        )}
      </div>

      <div
        style={{
          width: 140,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '60%',
            height: '100%',
            borderRadius: 2,
            background: 'linear-gradient(90deg, var(--festival-ember), var(--festival-gold))',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {isSlow && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          <div
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(255, 209, 102, 0.1)',
              border: '1px solid rgba(255, 209, 102, 0.25)',
              color: '#FFD166',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            ⏳ Server waking up: ~{countdown}s remaining
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Reload
            </button>
            <button
              type="button"
              onClick={() => {
                createGuestPlayerIfMissing()
                window.location.href = '/games'
              }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #FF6B35, #FFD700)',
                border: 'none',
                color: '#1a0800',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              🎮 Play as Guest
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Legacy detail route redirect component
function DetailRedirect() {
  const { gameId } = useParams()
  return <Navigate to={`/game/${gameId}/mode`} replace />
}

export default function App() {
  const [player, setPlayer] = useState(null)
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled())
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('nosplash')) return false
    return !sessionStorage.getItem('ganpati_splash_seen')
  })

  useEffect(() => {
    warmUpBackend()
    const saved = localStorage.getItem('ganpati_player')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPlayer(parsed)
        const localUP = parseInt(localStorage.getItem('ganpati_universal_points') || '0', 10)
        const initialUP = Math.max(localUP, Number(parsed.universal_points || 0))
        if (initialUP > 0) {
          localStorage.setItem('ganpati_universal_points', String(initialUP))
        }

        // Asynchronously fetch latest authoritative stats from server
        const pid = parsed.player_id || parsed.id
        if (pid) {
          getProfile(pid)
            .then((prof) => {
              if (prof?.player) {
                const authoritativeUP = prof.player.universal_points ?? prof.competitive?.universal_points ?? initialUP
                const updated = {
                  ...parsed,
                  ...prof.player,
                  universal_points: authoritativeUP,
                  progression: prof.progression,
                }
                setPlayer(updated)
                localStorage.setItem('ganpati_player', JSON.stringify(updated))
                setUniversalPoints(authoritativeUP)
              }
            })
            .catch(() => {})
        }
      } catch (_) {
        localStorage.removeItem('ganpati_player')
      }
    }

    const onPointsUpdated = (e) => {
      if (e.detail?.universal_points !== undefined) {
        setPlayer((prev) => (prev ? { ...prev, universal_points: e.detail.universal_points } : prev))
      }
    }

    const onPlayerUpdated = (e) => {
      if (e.detail?.player) {
        setPlayer((prev) => ({ ...(prev || {}), ...e.detail.player }))
      }
    }

    window.addEventListener('ganpati_points_updated', onPointsUpdated)
    window.addEventListener('ganpati_player_updated', onPlayerUpdated)

    return () => {
      window.removeEventListener('ganpati_points_updated', onPointsUpdated)
      window.removeEventListener('ganpati_player_updated', onPlayerUpdated)
    }
  }, [])

  const handlePlayerSetup = (playerData) => {
    localStorage.setItem('ganpati_player', JSON.stringify(playerData))
    if (playerData.universal_points !== undefined) {
      setUniversalPoints(playerData.universal_points)
    }
    setPlayer(playerData)
  }

  const handleLogout = () => {
    localStorage.removeItem('ganpati_player')
    localStorage.removeItem('ganpati_universal_points')
    setPlayer(null)
  }

  const toggleSound = useCallback(() => {
    const next = !soundEnabled
    setSoundEnabledState(next)
    setSoundEnabled(next)
  }, [soundEnabled])

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          sessionStorage.setItem('ganpati_splash_seen', '1')
          setShowSplash(false)
        }}
      />
    )
  }

  return (
    <div className="app">
      <FestiveBackground />
      <ServerWakeupBanner />
      <ErrorBoundary>
        <TopNav
          player={player}
          soundEnabled={soundEnabled}
          onSoundToggle={toggleSound}
        />
      </ErrorBoundary>
      <main className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<GameLoadingScreen />}>
            <Routes>
              {/* Step 1: Landing Screen */}
              <Route path="/" element={<Home player={player} />} />

              {/* Step 2: Game Hub */}
              <Route path="/games" element={<GameHub />} />

              {/* Step 3: Game Mode Selection */}
              <Route path="/game/:gameId/mode" element={<GameModeScreen />} />

              {/* Step 4: Solo Difficulty Selection */}
              <Route path="/game/:gameId/difficulty" element={<DifficultyScreen />} />

              {/* Step 5: Game Instructions & Pre-Game */}
              <Route path="/game/:gameId/instructions" element={<GameInstructionsScreen />} />

              {/* Legacy redirect */}
              <Route path="/game/:gameId/detail" element={<DetailRedirect />} />

              {/* Step 6 & 7: Gameplay Screens */}
              <Route path="/game/modak-rush" element={<ModakRush player={player} />} />
              <Route path="/game/diya-dash" element={<DiyaDash player={player} />} />
              <Route path="/game/dhol-battle" element={<DholBattle player={player} />} />
              <Route path="/game/rangoli-rush" element={<RangoliRush player={player} />} />
              <Route path="/game/mushak-maze" element={<MushakMaze player={player} />} />
              <Route path="/game/ganpati-logic" element={<GanpatiLogic player={player} />} />
              <Route path="/blitz-mix" element={<BlitzMix player={player} />} />

              {/* Result Screens */}
              <Route path="/game/modak-rush/result" element={<ResultScreen gameId="modak-rush" player={player} />} />
              <Route path="/game/:gameId/result" element={<ResultScreen player={player} />} />

              {/* Core Platforms */}
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/leaderboard/:gameId" element={<Leaderboard />} />
              <Route path="/daily-challenge" element={<DailyChallenge />} />
              <Route path="/profile" element={<ProfilePage player={player} onPlayerSetup={handlePlayerSetup} />} />
              <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
              <Route path="/player" element={<PlayerSetupPage onSetup={handlePlayerSetup} />} />
              <Route path="/achievements" element={<Achievements />} />

              {/* Multiplayer Flow */}
              <Route path="/multiplayer" element={<MultiplayerPage player={player} />} />
              <Route path="/multiplayer/friend" element={<FriendRoomPage player={player} onPlayerSetup={handlePlayerSetup} />} />
              <Route path="/multiplayer/waiting" element={<WaitingRoomPage player={player} onPlayerSetup={handlePlayerSetup} />} />
              <Route path="/multiplayer/game" element={<MultiplayerGame player={player} />} />
              <Route path="/multiplayer/result" element={<MatchResultPage player={player} />} />
              <Route path="/multiplayer/quick-match" element={<QuickMatchPage player={player} />} />
              <Route path="/multiplayer/history" element={<MatchHistoryPage player={player} />} />

              {/* Clean Redirects */}
              <Route path="/how-to-play" element={<Navigate to="/games" replace />} />
              <Route path="/stats" element={<Navigate to="/profile" replace />} />
              <Route path="/multiplayer/leaderboard" element={<Navigate to="/leaderboard" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Analytics />
    </div>
  )
}
