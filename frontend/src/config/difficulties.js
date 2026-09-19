// Central Difficulty Configuration for Ganpati Blitz

export const DIFFICULTY_TIERS = {
  easy: {
    id: 'easy',
    name: 'Easy',
    color: '#4ADE80',
    bg: 'rgba(74, 222, 128, 0.12)',
    border: 'rgba(74, 222, 128, 0.35)',
    multiplier: 1.0,
    multiplierLabel: '1.0x',
    shortDesc: 'Relaxed & forgiving',
    desc: 'Gentle pacing, generous timing, and simple patterns. Ideal for warm-up or first-time players.',
    defaultUnlocked: true,
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    multiplier: 1.5,
    multiplierLabel: '1.5x',
    shortDesc: 'Standard challenge',
    desc: 'Balanced pacing, standard rules, moderate penalties, and rewarding combos.',
    defaultUnlocked: true,
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.35)',
    multiplier: 2.2,
    multiplierLabel: '2.2x',
    shortDesc: 'High speed & hazards',
    desc: 'Faster reactions, complex patterns, limited mistakes, and new hazard mechanics.',
    defaultUnlocked: false,
    prerequisiteTier: 'normal',
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.35)',
    multiplier: 3.2,
    multiplierLabel: '3.2x',
    shortDesc: 'Extreme precision',
    desc: 'Fast-paced decision making, punishing mistakes, advanced mechanics, and intense focus.',
    defaultUnlocked: false,
    prerequisiteTier: 'hard',
  },
  master: {
    id: 'master',
    name: 'Master',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.35)',
    multiplier: 5.0,
    multiplierLabel: '5.0x',
    shortDesc: 'Relentless chaos',
    desc: 'Flawless execution required. Unique chaos conditions, maximum speed, and maximum mastery test.',
    defaultUnlocked: false,
    prerequisiteTier: 'expert',
  },
}

export const DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'expert', 'master']

// Game-specific score thresholds to unlock next difficulty
export const GAME_UNLOCK_THRESHOLDS = {
  'modak-rush': {
    hard: { score: 400, label: 'Score 400+ on Normal' },
    expert: { score: 900, label: 'Score 900+ on Hard' },
    master: { score: 1800, label: 'Score 1800+ on Expert' },
  },
  'diya-dash': {
    hard: { score: 450, label: 'Score 450+ on Normal (Level 5)' },
    expert: { score: 950, label: 'Score 950+ on Hard (Level 8)' },
    master: { score: 1800, label: 'Score 1800+ on Expert (Level 11)' },
  },
  'dhol-battle': {
    hard: { score: 550, label: 'Score 550+ on Normal' },
    expert: { score: 1300, label: 'Score 1300+ on Hard' },
    master: { score: 2400, label: 'Score 2400+ on Expert' },
  },
  'rangoli-rush': {
    hard: { score: 500, label: 'Score 500+ on Normal' },
    expert: { score: 1200, label: 'Score 1200+ on Hard' },
    master: { score: 2200, label: 'Score 2200+ on Expert' },
  },
  'mushak-maze': {
    hard: { score: 350, label: 'Score 350+ on Normal' },
    expert: { score: 800, label: 'Score 800+ on Hard' },
    master: { score: 1500, label: 'Score 1500+ on Expert' },
  },
  'ganpati-logic': {
    hard: { score: 450, label: 'Score 450+ on Normal' },
    expert: { score: 1100, label: 'Score 1100+ on Hard' },
    master: { score: 2000, label: 'Score 2000+ on Expert' },
  },
}

export function getDifficulty(tierId) {
  return DIFFICULTY_TIERS[tierId] || DIFFICULTY_TIERS.normal
}

export function getUnlockRequirement(gameId, tierId) {
  const gameConfig = GAME_UNLOCK_THRESHOLDS[gameId]
  if (!gameConfig || !gameConfig[tierId]) return null
  return gameConfig[tierId]
}
