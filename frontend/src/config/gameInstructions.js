export const GAME_INSTRUCTIONS = {
  'modak-rush': {
    id: 'modak-rush',
    title: 'Modak Rush',
    subtitle: 'Catch the sacred falling sweets for Lord Ganesha',
    objective:
      'Catch delicious modaks falling from the heavens while dodging cursed hazards and decoy offerings before the blitz clock expires.',
    steps: [
      {
        step: 1,
        title: 'Catch Modaks',
        desc: 'Gather Classic (+10), Silver (+20), and Golden (+30) modaks as they cascade downward.',
      },
      {
        step: 2,
        title: 'Trigger Frenzy',
        desc: 'Catch Kesar Modaks (+40) or build a 10x catch streak to unleash Modak Frenzy with 2x point values!',
      },
      {
        step: 3,
        title: 'Avoid Hazards',
        desc: 'Evade purple Decoy modaks (-20), burnt modaks (-15), and red Asura skulls (-35 pts & combo break).',
      },
    ],
    controls: {
      desktop: 'Click / Tap falling objects directly with the mouse cursor.',
      mobile: 'Tap falling objects with your fingers. Multiple simultaneous taps supported!',
    },
    scoring:
      'Base points per catch multiplied by your difficulty multiplier. High streaks award up to +15 bonus Universal Points on completion.',
  },

  'diya-dash': {
    id: 'diya-dash',
    title: 'Diya Dash',
    subtitle: 'Sacred Swara memory and sequence challenge',
    objective:
      'Listen to the divine musical notes (Swaras) and memorize the glowing sequence of lamps on the temple altar, then recreate it without fault.',
    steps: [
      {
        step: 1,
        title: 'Watch & Listen',
        desc: 'Observe the diyas light up to authentic Indian classical notes (Bilawal thaat swaras).',
      },
      {
        step: 2,
        title: 'Recreate the Sequence',
        desc: 'Tap the diyas in the identical order. Each cleared round adds one additional diya to the sequence.',
      },
      {
        step: 3,
        title: 'Master Hazards & Pradakshina',
        desc: 'Avoid grey smoke decoy cells on Expert. In Master mode, every 3rd round requires reverse recall!',
      },
    ],
    controls: {
      desktop: 'Click lamps with the mouse in sequence.',
      mobile: 'Tap the glowing diya pads directly on your screen.',
    },
    scoring:
      'Points increase with each level. Completing sequences in under 3.5 seconds awards up to +150 speed bonus points.',
  },

  'dhol-battle': {
    id: 'dhol-battle',
    title: 'Dhol Battle',
    subtitle: 'Festive rhythmic drum beat mastery',
    objective:
      'Match the thunderous beats of festival dhol drums by striking the notes precisely as they reach the golden target zone.',
    steps: [
      {
        step: 1,
        title: 'Follow the Cascade',
        desc: 'Watch rhythmic beats travel down the lanes toward the target markers at the bottom.',
      },
      {
        step: 2,
        title: 'Hit the Timing Zone',
        desc: 'Strike when beats hit the center for PERFECT (100 pts) or GOOD (60 pts). Maintain streaks for combo multipliers!',
      },
      {
        step: 3,
        title: 'Dodge Demon Ghost Beats',
        desc: 'On Hard, Expert, and Master difficulties, let dark skull notes pass by untouched. Tapping them docks 120 points!',
      },
    ],
    controls: {
      desktop: 'Press keyboard keys: D, F, J, K (or F, J on Easy). Alternatively click lane buttons.',
      mobile: 'Tap the colored drum pads at the base of each rhythm lane.',
    },
    scoring:
      'Accuracy window: Perfect (+100), Good (+60), Miss (0). Streak multipliers up to 3x. Dodging ghost beats awards +30 discipline bonus.',
  },

  'rangoli-rush': {
    id: 'rangoli-rush',
    title: 'Rangoli Rush',
    subtitle: 'Mandala symmetry and pattern completion',
    objective:
      'Inspect festive symmetrical rangoli patterns and identify the exact missing tile before time runs out.',
    steps: [
      {
        step: 1,
        title: 'Analyze the Mandala',
        desc: 'Examine colors, motifs, and radial geometric symmetry around the missing tile slot.',
      },
      {
        step: 2,
        title: 'Identify Correct Piece',
        desc: 'Select the one matching tile among the 4 candidate choices.',
      },
      {
        step: 3,
        title: 'Check Rotational Orientation',
        desc: 'On Hard+ difficulties, candidate pieces are rotated (0°, 90°, 180°, 270°). Only the proper orientation fits!',
      },
    ],
    controls: {
      desktop: 'Click the matching candidate tile from the bottom options.',
      mobile: 'Tap the candidate tile option with your finger.',
    },
    scoring:
      'Correct answer (+50 pts) plus speed bonus (up to +30 pts for instant solutions). Consecutive correct solutions build multipliers.',
  },

  'mushak-maze': {
    id: 'mushak-maze',
    title: 'Mushak Modak Chase',
    subtitle: 'Classic arcade modak gobbling & palace cat chase',
    objective:
      'Steer Mushak continuously through the temple labyrinth to gobble all Prasad Modaks, collect sacred offerings, and bonk cats during Super Divine Mode!',
    steps: [
      {
        step: 1,
        title: 'Gobble Prasad Modaks',
        desc: 'Glide continuously through temple corridors eating delicious yellow modaks (+10 pts each) to clear the stage.',
      },
      {
        step: 2,
        title: 'Evade the Palace Cats',
        desc: 'Watch out for roaming guard cats (Marjar, Shyama, Pinku, Neelu). Touching a cat costs 1 life.',
      },
      {
        step: 3,
        title: 'Super Divine Mushak Bonk',
        desc: 'Chomp Golden Maha-Laddus (+50 pts) to turn invincible! Scared cats flee—chase and bonk them for combo points (+200, +400, +800, +1600 pts)!',
      },
    ],
    controls: {
      desktop: 'Arrow keys or W, A, S, D to steer. Directions auto-buffer at intersections.',
      mobile: 'Swipe in desired direction or tap the on-screen responsive D-Pad.',
    },
    scoring:
      'Modaks (+10 pts), Maha-Laddus (+50 pts), Temple Fruits (+200 to +500 pts), Cat Bonk Combos (+200/400/800/1600 pts), and Stage Clear bonus (+500 pts + time bonus).',
  },

  'ganpati-logic': {
    id: 'ganpati-logic',
    title: 'Ganpati Logic',
    subtitle: 'Brain blitz arithmetic, sequences, and riddles',
    objective:
      'Solve rapid-fire numerical sequences, matrix patterns, and festive comparative riddles under relentless blitz clock pressure.',
    steps: [
      {
        step: 1,
        title: 'Read the Rule Prompt',
        desc: 'Understand the arithmetic progression, matrix relationship, or festive riddle shown.',
      },
      {
        step: 2,
        title: 'Pick the Answer',
        desc: 'Select the single correct solution among the 4 options.',
      },
      {
        step: 3,
        title: 'Chain Correct Answers',
        desc: 'Answer quickly to maximize speed bonuses. Beware: wrong answers dock 3 seconds in Master mode!',
      },
    ],
    controls: {
      desktop: 'Click answer options with mouse, or press keyboard keys 1, 2, 3, 4.',
      mobile: 'Tap the answer card directly.',
    },
    scoring:
      'Correct answers award base points (+20 pts) plus remaining timer bonus. High accuracy unlocks maximum Universal Points.',
  },
}

export function getGameInstructions(gameId) {
  return (
    GAME_INSTRUCTIONS[gameId] || {
      id: gameId,
      title: 'Festival Mini-Game',
      subtitle: 'Festive arcade challenge',
      objective: 'Play through the challenges to achieve the highest possible score and earn Universal Points.',
      steps: [
        { step: 1, title: 'Learn the Rules', desc: 'Focus on speed and precision.' },
        { step: 2, title: 'Build Streaks', desc: 'Maintain combos for multipliers.' },
        { step: 3, title: 'Earn Universal Points', desc: 'Normalized performance ranks on the global leaderboard.' },
      ],
      controls: {
        desktop: 'Click or use keyboard controls.',
        mobile: 'Tap on-screen controls.',
      },
      scoring: 'Scores are normalized and multiplied by difficulty tier.',
    }
  )
}
