import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowLeft, Target, BookOpen, Monitor, Smartphone, Award, Trophy } from 'lucide-react'
import { getGame } from '../config/games'
import { getGameInstructions } from '../config/gameInstructions'
import { DIFFICULTY_TIERS } from '../config/difficulties'
import { getSelectedDifficulty, getTierBestScore } from '../utils/progression'
import BackButton from '../components/BackButton'

export default function GameInstructionsScreen() {
  const { gameId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const game = getGame(gameId)
  const diffParam = searchParams.get('diff') || getSelectedDifficulty(gameId) || 'normal'
  const tierConfig = DIFFICULTY_TIERS[diffParam] || DIFFICULTY_TIERS.normal
  const instructions = getGameInstructions(gameId)
  const tierBest = getTierBestScore(gameId, diffParam)

  if (!game) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#FFF' }}>Game not found.</p>
        <BackButton to="/games" label="Return to Game Hub" />
      </div>
    )
  }

  const handleStartGame = () => {
    navigate(`/game/${game.id}?diff=${diffParam}&autostart=1`)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 88px)', padding: '1.25rem 1rem 4.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Top Bar with Back to Difficulty Selection */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackButton to={`/game/${game.id}/difficulty`} label="Difficulty" />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9CA3AF)', fontWeight: 600 }}>
            Pre-Game Briefing
          </div>
        </div>

        {/* Game Hero Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(15, 12, 34, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-xl, 20px)',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 'var(--radius-lg, 14px)',
                overflow: 'hidden',
                background: game.gradient,
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
              }}
            >
              {game.image ? (
                <img src={game.image} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.2rem' }}>{game.icon}</span>
              )}
            </div>

            <div>
              <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.6rem', fontWeight: 900, color: '#FFF' }}>
                {game.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    background: tierConfig.bg,
                    border: `1px solid ${tierConfig.border}`,
                    color: tierConfig.color,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {tierConfig.name} MODE ({tierConfig.multiplierLabel})
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Duration: {game.duration ? `${game.duration}s Blitz` : 'Level Survival'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Personal Best ({tierConfig.name})
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFD166', fontFamily: 'var(--font-mono)' }}>
              {tierBest > 0 ? tierBest.toLocaleString() : '---'}
            </div>
          </div>
        </div>

        {/* 1. OBJECTIVE */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg, 14px)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD166', fontWeight: 800, fontSize: '0.86rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Target size={16} /> Objective
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#F1F5F9', lineHeight: 1.6 }}>
            {instructions.objective}
          </p>
        </div>

        {/* 2. HOW TO PLAY */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg, 14px)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD166', fontWeight: 800, fontSize: '0.86rem', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            <BookOpen size={16} /> How to Play
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {instructions.steps.map((s) => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 209, 102, 0.15)',
                    border: '1px solid rgba(255, 209, 102, 0.3)',
                    color: '#FFD166',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FFF', marginBottom: '0.15rem' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #9CA3AF)', lineHeight: 1.45 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CONTROLS (Desktop vs Mobile) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Desktop Controls */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 14px)',
              padding: '1.15rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38BDF8', fontWeight: 800, fontSize: '0.84rem', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              <Monitor size={15} /> Desktop Controls
            </div>
            <div style={{ fontSize: '0.86rem', color: '#E2E8F0', lineHeight: 1.5 }}>
              {instructions.controls.desktop}
            </div>
          </div>

          {/* Mobile Controls */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 14px)',
              padding: '1.15rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#4ADE80', fontWeight: 800, fontSize: '0.84rem', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              <Smartphone size={15} /> Mobile & Touch Controls
            </div>
            <div style={{ fontSize: '0.86rem', color: '#E2E8F0', lineHeight: 1.5 }}>
              {instructions.controls.mobile}
            </div>
          </div>
        </div>

        {/* 4. SCORING */}
        <div
          style={{
            padding: '0.9rem 1.15rem',
            background: 'rgba(255, 215, 0, 0.06)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: 'var(--radius-lg, 12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Award size={20} color="#FFD700" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: '#FEF08A', lineHeight: 1.45 }}>
            <strong>Scoring:</strong> {instructions.scoring}
          </div>
        </div>

        {/* Action Buttons: START GAME (Primary) & Back */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartGame}
            style={{
              width: '100%',
              padding: '1.15rem 2rem',
              borderRadius: 'var(--radius-xl, 18px)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
              color: '#0C081C',
              fontFamily: 'var(--font-display, inherit)',
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: '0 6px 24px rgba(255, 140, 66, 0.45)',
            }}
          >
            <Play size={22} fill="#0C081C" /> START GAME
          </motion.button>

          <button
            type="button"
            onClick={() => navigate(`/game/${game.id}/difficulty`)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #9CA3AF)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            ← Change Difficulty
          </button>
        </div>
      </motion.div>
    </div>
  )
}
