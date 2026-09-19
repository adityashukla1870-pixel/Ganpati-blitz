import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock3, Home, Play, RotateCcw, Sparkles, Trophy, Star, Zap, Target, Brain, Flag, MousePointer, Award, AlertTriangle, Gamepad2, Timer } from 'lucide-react'
import { submitScore } from '../services/api'
import { getBestScore, getPlayer, setBestScore } from '../utils/storage'
import { LogoSquare, LogoIcon } from '../components/Logo'

const ROUND_SECONDS = 12
const ROUNDS = [
  { id: 'modak-rush', name: 'Modak Rush', icon: 'modak-rush', type: 'tap', prompt: 'Collect 10 modaks.' },
  { id: 'diya-dash', name: 'Diya Dash', icon: 'diya-dash', type: 'sequence', prompt: 'Remember and repeat the sequence.' },
  { id: 'dhol-battle', name: 'Dhol Battle', icon: 'dhol-battle', type: 'rhythm', prompt: 'Tap when the beat is glowing.' },
  { id: 'rangoli-rush', name: 'Rangoli Rush', icon: 'rangoli-rush', type: 'choice', prompt: 'Pick the matching rangoli piece.' },
  { id: 'mushak-maze', name: 'Mushak Maze', icon: 'mushak-maze', type: 'path', prompt: 'Enter the path to the modak.' },
  { id: 'ganpati-logic', name: 'Ganpati Logic', icon: 'ganpati-logic', type: 'logic', prompt: 'Solve the quick pattern.' },
]

const makeRound = (roundIndex) => {
  const round = ROUNDS[roundIndex]
  if (round.type === 'sequence') return { ...round, sequence: [1, 3, 0, 2].slice(0, 3 + (roundIndex % 2)), input: [], showing: true }
  if (round.type === 'choice') return { ...round, options: ['A', 'B', 'C', 'D'], answer: 0 }
  if (round.type === 'path') return { ...round, path: ['↑', '→', '↓', '→'], input: [] }
  if (round.type === 'logic') return { ...round, options: ['10', '12', '14', '16'], answer: 2 }
  return { ...round, count: 0, beatActive: false }
}

export default function BlitzMix() {
  const player = getPlayer()
  const [state, setState] = useState('idle')
  const [roundIndex, setRoundIndex] = useState(0)
  const [round, setRound] = useState(() => makeRound(0))
  const [seconds, setSeconds] = useState(ROUND_SECONDS)
  const [roundScores, setRoundScores] = useState([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const startedAt = useRef(0)
  const sessionId = useRef(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
  const best = getBestScore('blitz-mix')

  useEffect(() => {
    if (state !== 'playing') return undefined
    const timer = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          finishRound(0)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [state, roundIndex, roundScores])

  useEffect(() => {
    if (state !== 'playing' || round.type !== 'rhythm') return undefined
    const pulse = setInterval(() => setRound((value) => ({ ...value, beatActive: !value.beatActive })), 650)
    return () => clearInterval(pulse)
  }, [state, round.type])

  const start = () => {
    sessionId.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    setRoundIndex(0); setRound(makeRound(0)); setRoundScores([]); setSeconds(ROUND_SECONDS); setState('playing'); setMessage('')
    startedAt.current = Date.now()
  }

  const finishRound = (score) => {
    if (state !== 'playing') return
    const nextScores = [...roundScores, Math.max(0, Math.min(100, score))]
    if (roundIndex >= ROUNDS.length - 1) {
      setRoundScores(nextScores); setState('result'); saveRun(nextScores)
      return
    }
    setRoundScores(nextScores); setRoundIndex((value) => value + 1); setRound(makeRound(roundIndex + 1)); setSeconds(ROUND_SECONDS)
  }

  const saveRun = async (scores) => {
    const total = scores.reduce((sum, value) => sum + value, 0)
    setBestScore(total, 'blitz-mix')
    if (!player?.player_id) return
    setSaving(true)
    try {
      await submitScore(player.player_id, total, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)), { game_id: 'blitz-mix', session_id: sessionId.current, rounds: scores })
      setMessage('Run saved. +50 XP awarded.')
    } catch (error) {
      setMessage(error.response?.data?.error || 'Your result could not be processed. Please try again.')
    } finally { setSaving(false) }
  }

  const tapModak = () => {
    const count = round.count + 1
    if (count >= 10) finishRound(Math.min(100, 60 + seconds * 4))
    else setRound({ ...round, count })
  }

  const choose = (index) => finishRound(index === round.answer ? Math.min(100, 70 + seconds * 2) : 0)
  const sequenceTap = (index) => {
    if (round.sequence[round.input.length] !== index) return finishRound(0)
    const input = [...round.input, index]
    if (input.length === round.sequence.length) finishRound(Math.min(100, 70 + seconds * 2))
    else setRound({ ...round, input, showing: false })
  }
  const pathTap = (value) => {
    if (round.path[round.input.length] !== value) return finishRound(0)
    const input = [...round.input, value]
    if (input.length === round.path.length) finishRound(Math.min(100, 65 + seconds * 3))
    else setRound({ ...round, input })
  }

  if (!player) return <main style={styles.center}>Set up your player profile first.</main>
  if (state === 'idle') return <main style={styles.center}><section className="card" style={styles.card}><div style={styles.hero}><LogoIcon size={32} /></div><h1>BLITZ MIX</h1><p style={styles.muted}>Six games. Six quick rounds. Every round is scored from 0 to 100.</p><button onClick={start} style={styles.primary}><Play size={18} /> START BLITZ MIX</button><Link to="/games" style={styles.back}>Back to Arcade</Link></section></main>
  if (state === 'result') {
    const total = roundScores.reduce((sum, value) => sum + value, 0)
    return <main style={styles.page}><section className="card" style={styles.card}><div style={styles.hero}><Trophy size={32} /></div><h1>BLITZ MIX COMPLETE</h1><div style={styles.total}>{total}/600</div><p style={styles.muted}>{saving ? 'Saving your run...' : message || (total > best ? 'New personal best!' : 'Run complete.')}</p>{roundScores.map((score, index) => <div key={ROUNDS[index].id} style={styles.row}><span><LogoSquare size={20} /> {ROUNDS[index].name}</span><strong>{score}/100</strong></div>)}<button onClick={start} style={styles.primary}><RotateCcw size={18} /> PLAY AGAIN</button><Link to="/games" style={styles.back}><Home size={17} /> ARCADE</Link></section></main>
  }

  return <main style={styles.page}><section className="card" style={styles.card}><div style={styles.progress}>ROUND {roundIndex + 1}/{ROUNDS.length}<span><Clock3 size={15} /> {seconds}s</span></div><div style={styles.hero}><LogoSquare size={48} /></div><h1>{round.name}</h1><p style={styles.muted}>{round.prompt}</p>{round.type === 'tap' && <button onClick={tapModak} style={styles.bigButton}><LogoSquare size={20} /> {round.count}/10</button>}{round.type === 'sequence' && <div style={styles.controls}>{round.showing ? <div style={styles.sequence}>{round.sequence.map((item) => <span key={item}><LogoSquare size={24} /></span>)}</div> : [0, 1, 2, 3].map((item) => <button key={item} onClick={() => sequenceTap(item)} style={styles.tile}><LogoSquare size={24} /></button>)}</div>}{round.type === 'rhythm' && <button onClick={() => finishRound(round.beatActive ? 100 : 20)} style={{ ...styles.bigButton, background: round.beatActive ? 'var(--success)' : 'var(--darker)' }}><LogoSquare size={20} /> {round.beatActive ? 'HIT NOW' : 'WAIT'}</button>}{round.type === 'choice' && <div style={styles.controls}>{round.options.map((option, index) => <button key={option} onClick={() => choose(index)} style={styles.tile}>{option}</button>)}</div>}{round.type === 'path' && <div style={styles.controls}>{['↑', '→', '↓', '←'].map((value) => <button key={value} onClick={() => pathTap(value)} style={styles.tile}>{value}</button>)}</div>}{round.type === 'logic' && <div style={styles.controls}>{round.options.map((option, index) => <button key={option} onClick={() => choose(index)} style={styles.tile}>{option}</button>)}</div>}</section></main>
}

const styles = {
  page: { minHeight: 'calc(100vh - 88px)', maxWidth: 620, margin: '0 auto', padding: '2rem 1rem 4rem' },
  center: { minHeight: 'calc(100vh - 88px)', display: 'grid', placeItems: 'center', padding: '1rem' },
  card: { padding: '2rem', textAlign: 'center' },
  hero: { fontSize: '4rem', marginBottom: '0.5rem' },
  muted: { color: 'var(--text-muted)', lineHeight: 1.5 },
  primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '0.9rem', color: '#fff', background: 'var(--primary)', border: 0, borderRadius: 'var(--radius-lg)', fontWeight: 800, cursor: 'pointer', marginTop: '1rem' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--text-muted)', textDecoration: 'none', marginTop: '1rem' },
  progress: { display: 'flex', justifyContent: 'space-between', color: 'var(--secondary)', fontWeight: 800, fontSize: '0.8rem' },
  bigButton: { minWidth: 220, minHeight: 120, padding: '1.5rem', color: '#fff', border: 0, borderRadius: 'var(--radius-lg)', fontSize: '1.4rem', fontWeight: 800, cursor: 'pointer' },
  controls: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(100px, 1fr))', gap: '0.8rem', marginTop: '1rem' },
  tile: { minHeight: 78, background: 'var(--darker)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: '1.8rem', cursor: 'pointer' },
  sequence: { display: 'flex', justifyContent: 'center', gap: '0.8rem', fontSize: '2.3rem', padding: '2rem' },
  total: { color: 'var(--secondary)', fontSize: '3rem', fontWeight: 900, margin: '1rem' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' },
}