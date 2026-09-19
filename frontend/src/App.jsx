import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
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
import { getSoundEnabled, setSoundEnabled } from './utils/storage'

const ModakRush = lazy(() => import('./pages/ModakRush'))
const DiyaDash = lazy(() => import('./games/diyaDash/DiyaDash'))
const DholBattle = lazy(() => import('./games/dholBattle/DholBattle'))
const RangoliRush = lazy(() => import('./games/rangoliRush/RangoliRush'))
const MushakMaze = lazy(() => import('./games/mushakMaze/MushakMaze'))
const GanpatiLogic = lazy(() => import('./games/ganpatiLogic/GanpatiLogic'))
const BlitzMix = lazy(() => import('./pages/BlitzMix'))

const GameLoader = (
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
      gap: '1rem',
    }}
  >
    <div style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>🐘</div>
    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading game...</div>
    <div
      style={{
        width: 120,
        height: 3,
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
  </div>
)

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
    let saved = localStorage.getItem('ganpati_player')
    if (!saved) {
      const defaultPlayer = {
        player_id: 'b308814e-cc17-4341-b03f-6840b687eb00',
        display_name: 'Aditya Shukla',
        name: 'Aditya Shukla',
        campus: 'NIAT Jaipur',
        avatar: '🪷',
        level: 3,
        xp: 180,
        xpNext: 300,
        universal_points: 284,
      }
      localStorage.setItem('ganpati_player', JSON.stringify(defaultPlayer))
      saved = JSON.stringify(defaultPlayer)
    }
    if (saved) setPlayer(JSON.parse(saved))
  }, [])

  const handlePlayerSetup = (playerData) => {
    localStorage.setItem('ganpati_player', JSON.stringify(playerData))
    setPlayer(playerData)
  }

  const handleLogout = () => {
    localStorage.removeItem('ganpati_player')
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
      <TopNav
        player={player}
        soundEnabled={soundEnabled}
        onSoundToggle={toggleSound}
      />
      <main className="main-content">
        <Suspense fallback={GameLoader}>
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
            <Route path="/profile" element={<ProfilePage player={player} />} />
            <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
            <Route path="/player" element={<PlayerSetupPage onSetup={handlePlayerSetup} />} />
            <Route path="/achievements" element={<Achievements />} />

            {/* Multiplayer Flow */}
            <Route path="/multiplayer" element={<MultiplayerPage player={player} />} />
            <Route path="/multiplayer/friend" element={<FriendRoomPage player={player} />} />
            <Route path="/multiplayer/waiting" element={<WaitingRoomPage player={player} />} />
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
      </main>
    </div>
  )
}
