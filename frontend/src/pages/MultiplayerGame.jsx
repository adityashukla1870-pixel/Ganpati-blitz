import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, AlertTriangle } from 'lucide-react'
import { getSocket } from '../services/socket'

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const GAME_DURATION = 30
const SPAWN_INTERVAL = 800
const OBJECT_SIZE = 48

const OBJ_TYPES = {
  normal: { emoji: '🍬', points: 10, bgColor: 'rgba(255, 107, 53, 0.25)', border: '2px solid rgba(255, 107, 53, 0.5)' },
  golden: { emoji: '✨', points: 30, bgColor: 'rgba(255, 215, 0, 0.25)', border: '2px solid rgba(255, 215, 0, 0.5)' },
  burnt: { emoji: '🔥', points: -15, bgColor: 'rgba(255, 99, 71, 0.25)', border: '2px solid rgba(255, 99, 71, 0.5)' },
  danger: { emoji: '💣', points: -25, bgColor: 'rgba(255, 68, 68, 0.3)', border: '2px solid rgba(255, 68, 68, 0.6)' },
}

function getComboMultiplier(combo) {
  if (combo >= 10) return 3
  if (combo >= 5) return 2
  if (combo >= 3) return 1.5
  return 1
}

function pickType(rng, elapsed) {
  const difficulty = elapsed / GAME_DURATION
  const roll = rng()
  if (roll < 0.06 + difficulty * 0.04) return 'danger'
  if (roll < 0.14 + difficulty * 0.06) return 'burnt'
  if (roll < 0.2 + difficulty * 0.02) return 'golden'
  return 'normal'
}

let objIdCounter = 0

export default function MultiplayerGame({ player }) {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const { room_code, seed, match_id, opponent, players } = state

  const gameAreaRef = useRef(null)
  const animFrameRef = useRef(null)
  const spawnTimerRef = useRef(null)
  const gameTimerRef = useRef(null)
  const startTimeRef = useRef(null)
  const objectsRef = useRef([])
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const gameOverRef = useRef(false)
  const rngRef = useRef(null)

  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [opponentName, setOpponentName] = useState('Opponent')
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION)
  const [gameState, setGameState] = useState('ready')
  const [popups, setPopups] = useState([])
  const [disconnected, setDisconnected] = useState(false)
  const [disconnectedMsg, setDisconnectedMsg] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    if (!room_code || !seed || !match_id) {
      navigate('/multiplayer')
      return
    }

    if (players && players.length >= 2) {
      const myId = player?.player_id
      const opp = players.find(p => p.player_id !== myId)
      if (opp) setOpponentName(opp.display_name)
    } else if (opponent) {
      setOpponentName(opponent.display_name || 'Opponent')
    }
  }, [room_code, seed, match_id, navigate, player, players, opponent])

  useEffect(() => {
    const socket = getSocket()

    const onOpponentScore = (data) => {
      setOpponentScore(data.score || 0)
    }

    const onGameFinished = (data) => {
      gameOverRef.current = true
      cleanup()
      navigate('/multiplayer/result', {
        state: {
          match_id: data.match_id,
          result: data.result,
          my_score: data.my_score,
          opponent_score: data.opponent_score,
          opponent_name: data.opponent_name,
          rating_before: data.rating_before,
          rating_after: data.rating_after,
          rating_change: data.rating_change,
        },
      })
    }

    const onPlayerDisconnected = (data) => {
      if (!gameOverRef.current) {
        setDisconnected(true)
        setDisconnectedMsg(data.message || 'Opponent disconnected. Waiting...')
      }
    }

    const onPlayerReconnected = () => {
      setDisconnected(false)
      setDisconnectedMsg('')
    }

    const onMatchEnded = (data) => {
      gameOverRef.current = true
      cleanup()
      navigate('/multiplayer/result', {
        state: {
          match_id: data.match_id,
          result: 'win',
          my_score: scoreRef.current,
          opponent_score: 0,
          opponent_name: opponentName,
          rating_before: 0,
          rating_after: 0,
          rating_change: 25,
        },
      })
    }

    socket.on('score_update_live', onOpponentScore)
    socket.on('score_update', onOpponentScore)
    socket.on('game_finished', onGameFinished)
    socket.on('player_disconnected', onPlayerDisconnected)
    socket.on('player_reconnected', onPlayerReconnected)
    socket.on('match_ended_by_disconnect', onMatchEnded)

    return () => {
      socket.off('score_update_live', onOpponentScore)
      socket.off('score_update', onOpponentScore)
      socket.off('game_finished', onGameFinished)
      socket.off('player_disconnected', onPlayerDisconnected)
      socket.off('player_reconnected', onPlayerReconnected)
      socket.off('match_ended_by_disconnect', onMatchEnded)
    }
  }, [navigate, opponentName, match_id])

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current)
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    objectsRef.current = []
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const spawnObject = useCallback(() => {
    const area = gameAreaRef.current
    if (!area || gameOverRef.current) return
    const rect = area.getBoundingClientRect()
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const rng = rngRef.current
    if (!rng) return

    const difficulty = elapsed / GAME_DURATION
    const type = pickType(rng, elapsed)
    const baseSpeed = 1.5 + difficulty * 1.2

    const obj = {
      id: ++objIdCounter,
      type,
      x: 10 + rng() * 80,
      y: -8,
      speed: baseSpeed + rng() * 0.8,
      rotation: rng() * 360,
    }
    objectsRef.current = [...objectsRef.current, obj]
  }, [])

  const startGameLoop = useCallback(() => {
    const loop = () => {
      if (gameOverRef.current) return
      objectsRef.current = objectsRef.current
        .map(obj => ({ ...obj, y: obj.y + obj.speed }))
        .filter(obj => obj.y < 110)
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
  }, [])

  const startSpawning = useCallback(() => {
    const spawn = () => {
      if (gameOverRef.current) return
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const difficulty = elapsed / GAME_DURATION
      const interval = Math.max(350, SPAWN_INTERVAL - difficulty * 450)

      spawnObject()
      if (Math.random() < 0.25 + difficulty * 0.2) {
        setTimeout(spawnObject, 120 + Math.random() * 180)
      }
      spawnTimerRef.current = setTimeout(spawn, interval)
    }
    spawn()
  }, [spawnObject])

  const startGame = useCallback(() => {
    setGameState('playing')
    startTimeRef.current = Date.now()
    scoreRef.current = 0
    comboRef.current = 0
    maxComboRef.current = 0
    gameOverRef.current = false
    objectsRef.current = []
    rngRef.current = seededRandom(seed)

    setScore(0)
    setCombo(0)
    setTimeRemaining(GAME_DURATION)

    startSpawning()
    startGameLoop()

    gameTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, GAME_DURATION - elapsed)
      setTimeRemaining(Math.ceil(remaining))
      if (remaining <= 0) {
        clearInterval(gameTimerRef.current)
        endGame()
      }
    }, 100)
  }, [seed, startSpawning, startGameLoop])

  useEffect(() => {
    if (gameState === 'playing') return
    const socket = getSocket()
    const onStart = () => {
      startGame()
    }
    socket.on('game_started', onStart)
    return () => socket.off('game_started', onStart)
  }, [gameState, startGame])

  const endGame = useCallback(() => {
    gameOverRef.current = true
    cleanup()
    setGameState('gameover')
    const socket = getSocket()
    socket.emit('player_finished', {
      match_id,
      player_id: player?.player_id,
      score: scoreRef.current,
      duration: GAME_DURATION,
    })
  }, [cleanup, match_id, player])

  const handleCollect = useCallback((objId) => {
    if (gameOverRef.current) return
    const idx = objectsRef.current.findIndex(o => o.id === objId)
    if (idx === -1) return

    const obj = objectsRef.current[idx]
    objectsRef.current.splice(idx, 1)

    let newCombo = comboRef.current
    if (obj.type === 'normal' || obj.type === 'golden') {
      newCombo++
    } else {
      newCombo = 0
    }

    const mult = getComboMultiplier(newCombo)
    const points = Math.round(OBJ_TYPES[obj.type].points * mult)

    comboRef.current = newCombo
    scoreRef.current = Math.max(0, scoreRef.current + points)
    if (newCombo > maxComboRef.current) maxComboRef.current = newCombo

    setScore(scoreRef.current)
    setCombo(newCombo)

    const popupId = `${Date.now()}-${Math.random()}`
    setPopups(prev => [...prev, {
      id: popupId,
      x: obj.x,
      y: obj.y,
      text: points > 0 ? `+${points}` : `${points}`,
      color: points > 0 ? 'var(--success)' : 'var(--danger)',
    }])
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== popupId))
    }, 900)

    const socket = getSocket()
    socket.emit('score_update_live', {
      match_id,
      player_id: player?.player_id,
      score: scoreRef.current,
    })
  }, [match_id, player])

  const handleAreaClick = useCallback((e) => {
    if (gameOverRef.current || gameState !== 'playing') return
    const area = gameAreaRef.current
    if (!area) return
    const rect = area.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    let closest = null
    let closestDist = Infinity
    objectsRef.current.forEach(obj => {
      const dist = Math.sqrt((clickX - obj.x) ** 2 + (clickY - obj.y) ** 2)
      if (dist < 8 && dist < closestDist) {
        closest = obj
        closestDist = dist
      }
    })
    if (closest) handleCollect(closest.id)
  }, [gameState, handleCollect])

  const handleTouch = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      handleAreaClick({ clientX: touch.clientX, clientY: touch.clientY })
    }
  }, [handleAreaClick])

  if (!room_code || !seed || !match_id) return null

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 88px)', overflow: 'hidden' }}>
      {/* HUD */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
          padding: '0.6rem 1rem',
          background: 'rgba(15, 15, 35, 0.95)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 107, 53, 0.15)',
        }}
      >
        {/* Your side */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            YOU
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--secondary)' }}>
            {score.toLocaleString()}
          </div>
          {combo > 0 && (
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: combo >= 5 ? 'var(--secondary)' : 'var(--primary)' }}>
              🔥 x{combo} ({getComboMultiplier(combo)}x)
            </div>
          )}
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: timeRemaining <= 5 ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: timeRemaining <= 5 ? '2px solid var(--danger)' : '2px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800,
              color: timeRemaining <= 5 ? 'var(--danger)' : 'var(--text)',
            }}>
              {timeRemaining}
            </span>
          </div>
        </div>

        {/* Opponent side */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {opponentName}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
            {opponentScore.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>OPPONENT</div>
        </div>
      </div>

      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        style={{
          position: 'absolute', top: '75px', right: '10px', zIndex: 20,
          background: 'rgba(15, 15, 35, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: soundEnabled ? 'var(--primary)' : 'var(--text-muted)',
        }}
      >
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        onClick={handleAreaClick}
        onTouchStart={handleTouch}
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(255,153,51,0.12), transparent 60%), linear-gradient(180deg, #140a2e 0%, var(--festival-maroon) 100%)',
          overflow: 'hidden', cursor: 'pointer', touchAction: 'none',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.04) 0%, transparent 40%),
                            radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 40%)`,
        }} />

        <AnimatePresence>
          {objectsRef.current.map(obj => {
            const info = OBJ_TYPES[obj.type]
            return (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  left: `${obj.x}%`, top: `${obj.y}%`,
                  width: `${OBJECT_SIZE}px`, height: `${OBJECT_SIZE}px`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', cursor: 'pointer', userSelect: 'none',
                  background: info.bgColor, border: info.border,
                  borderRadius: obj.type === 'danger' ? 'var(--radius-md)' : '50%',
                  boxShadow: obj.type === 'golden'
                    ? '0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.15)'
                    : obj.type === 'danger'
                    ? '0 0 15px rgba(255,68,68,0.4)'
                    : '0 4px 12px rgba(0,0,0,0.3)',
                  transform: `translateX(-50%) rotate(${obj.rotation}deg)`,
                  zIndex: 5,
                  animation: obj.type === 'danger' ? 'pulse 1s ease-in-out infinite' : undefined,
                }}
              >
                {info.emoji}
              </motion.div>
            )
          })}
        </AnimatePresence>

        <AnimatePresence>
          {popups.map(popup => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: `${popup.x}%`, top: `${popup.y}%`,
                transform: 'translateX(-50%)',
                fontSize: '1.4rem', fontWeight: 900, color: popup.color,
                pointerEvents: 'none',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                zIndex: 50, fontFamily: 'var(--font-mono)',
              }}
            >
              {popup.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Disconnected overlay */}
      <AnimatePresence>
        {disconnected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <AlertTriangle size={48} style={{ color: 'var(--secondary)', marginBottom: '1rem' }} />
            </motion.div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
              {disconnectedMsg || 'Opponent Disconnected'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reconnecting...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game over overlay */}
      <AnimatePresence>
        {gameState === 'gameover' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
                TIME'S UP!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Waiting for results...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
