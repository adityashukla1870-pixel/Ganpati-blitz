// Universal Points Configuration & Rank Tier Definitions for Ganpati Blitz

export const BASE_COMPLETION_POINTS = 25;

export const RANK_TIERS = [
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    minPoints: 3500,
    badge: '👑',
    color: '#FFD700',
    border: 'rgba(255, 215, 0, 0.6)',
    bg: 'rgba(255, 215, 0, 0.12)',
    gradient: 'linear-gradient(135deg, #FFD700, #EC4899)',
    glow: '0 0 20px rgba(255, 215, 0, 0.45)',
  },
  {
    id: 'master',
    name: 'Master',
    minPoints: 2200,
    badge: '🏆',
    color: '#EC4899',
    border: 'rgba(236, 72, 153, 0.6)',
    bg: 'rgba(236, 72, 153, 0.12)',
    gradient: 'linear-gradient(135deg, #EC4899, #8E44AD)',
    glow: '0 0 18px rgba(236, 72, 153, 0.4)',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    minPoints: 1300,
    badge: '💎',
    color: '#38BDF8',
    border: 'rgba(56, 189, 248, 0.6)',
    bg: 'rgba(56, 189, 248, 0.12)',
    gradient: 'linear-gradient(135deg, #38BDF8, #3B82F6)',
    glow: '0 0 16px rgba(56, 189, 248, 0.35)',
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 700,
    badge: '🥇',
    color: '#FBBF24',
    border: 'rgba(251, 191, 36, 0.6)',
    bg: 'rgba(251, 191, 36, 0.12)',
    gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    glow: '0 0 14px rgba(251, 191, 36, 0.3)',
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 300,
    badge: '🥈',
    color: '#94A3B8',
    border: 'rgba(148, 163, 184, 0.5)',
    bg: 'rgba(148, 163, 184, 0.1)',
    gradient: 'linear-gradient(135deg, #94A3B8, #64748B)',
    glow: '0 0 10px rgba(148, 163, 184, 0.25)',
  },
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    badge: '🥉',
    color: '#CD7F32',
    border: 'rgba(205, 127, 50, 0.4)',
    bg: 'rgba(205, 127, 50, 0.1)',
    gradient: 'linear-gradient(135deg, #CD7F32, #92400E)',
    glow: 'none',
  },
];

export const DIFFICULTY_MULTIPLIERS = {
  easy: 0.75,
  normal: 1.00,
  hard: 1.35,
  expert: 1.75,
  master: 2.25,
};

export function getRankTier(points) {
  const pts = Math.max(0, parseInt(points, 10) || 0);
  for (const tier of RANK_TIERS) {
    if (pts >= tier.minPoints) {
      return tier;
    }
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

/**
 * Client-side calculation/preview for Universal Points earned from a run.
 */
export function estimateUniversalPoints({
  gameId,
  score = 0,
  duration = 30,
  difficulty = 'normal',
  stats = {},
  isPB = false,
  mpResult = null,
}) {
  const diffKey = (difficulty || 'normal').toLowerCase();
  const diffMult = DIFFICULTY_MULTIPLIERS[diffKey] || 1.00;

  if (duration < 8 && score <= 5) {
    return {
      base: 0,
      performanceNormalized: 0,
      multiplier: diffMult,
      subtotal: 0,
      bonuses: 0,
      totalUP: 0,
    };
  }

  // Normalization estimate
  let pNorm = 0;
  if (gameId === 'modak-rush') {
    const raw = stats.base ?? score;
    const acc = stats.accuracy ?? 85;
    pNorm = (raw / 350) * 75 + (acc / 100) * 25;
  } else if (gameId === 'diya-dash') {
    const lvl = stats.levelReached || stats.level || Math.max(1, score / 35);
    const speed = stats.speedBonuses || 0;
    pNorm = (lvl / 12) * 80 + Math.min(20, speed * 4);
  } else if (gameId === 'dhol-battle') {
    const perfect = stats.perfectHits || stats.perfect || 0;
    const good = stats.goodHits || stats.good || 0;
    const total = stats.totalNotes || (perfect + good + (stats.miss || 0)) || Math.max(1, score / 15);
    const streak = stats.maxStreak || stats.maxCombo || 0;
    const hitRatio = (perfect * 1.0 + good * 0.65) / Math.max(1, total);
    pNorm = hitRatio * 85 + Math.min(15, (streak / 20) * 15);
  } else if (gameId === 'rangoli-rush') {
    const rounds = stats.roundsCompleted || stats.rounds || Math.max(1, score / 50);
    const acc = stats.accuracy ?? 100;
    pNorm = (rounds / 10) * 70 + (acc / 100) * 30;
  } else if (gameId === 'mushak-maze') {
    const mazes = stats.mazesCompleted || stats.mazes || Math.max(1, score / 80);
    const laddus = stats.laddusCollected || stats.bonuses || 0;
    const traps = stats.traps || 0;
    pNorm = (mazes / 6) * 70 + Math.max(0, Math.min(30, laddus * 3 - traps * 5));
  } else if (gameId === 'ganpati-logic') {
    const correct = stats.correctAnswers || stats.correct || Math.max(1, score / 40);
    const acc = stats.accuracy ?? 100;
    pNorm = (correct / 12) * 75 + (acc / 100) * 25;
  } else {
    pNorm = (score / 400) * 100;
  }

  pNorm = Math.max(0, Math.min(100, Math.round(pNorm)));

  const base = BASE_COMPLETION_POINTS;
  const subtotal = Math.floor((base + pNorm) * diffMult);

  // Bonuses
  let comboBonus = 0;
  const combo = stats.maxCombo || stats.maxStreak || stats.streak || 0;
  if (combo >= 20) comboBonus = 15;
  else if (combo >= 10) comboBonus = 8;
  else if (combo >= 5) comboBonus = 4;

  let accBonus = 0;
  const acc = stats.accuracy || 0;
  if (acc >= 99.9) accBonus = 15;
  else if (acc >= 95) accBonus = 10;
  else if (acc >= 85) accBonus = 5;

  const pbBonus = isPB ? 10 : 0;
  let mpBonus = 0;
  if (mpResult === 'win') mpBonus = 30;
  else if (mpResult === 'draw') mpBonus = 15;
  else if (mpResult === 'loss') mpBonus = 8;

  const totalBonuses = comboBonus + accBonus + pbBonus + mpBonus;
  const totalUP = Math.max(5, subtotal + totalBonuses);

  return {
    base,
    performanceNormalized: pNorm,
    multiplier: diffMult,
    subtotal,
    comboBonus,
    accBonus,
    pbBonus,
    mpBonus,
    totalBonuses,
    totalUP,
  };
}
