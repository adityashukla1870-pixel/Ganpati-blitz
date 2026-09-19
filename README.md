# GANPATI BLITZ

A festival-themed mini-game arcade celebrating Ganesh Chaturthi.

## Arcade

Ganpati Blitz is a festive, fast-paced arcade platform where players compete across multiple short Ganesh Chaturthi-themed games, solo or with friends.

Available games:

- Modak Rush
- Diya Dash
- Dhol Battle
- Rangoli Rush
- Mushak Maze
- Ganpati Logic

Engagement modes include per-game leaderboards, XP and levels, achievements, Daily Challenge, player statistics, and solo Blitz Mix.

## Game: Modak Rush

Collect as many modaks as possible in 30 seconds! Tap valid modaks for points, avoid burnt modaks and danger items, and build combos for bonus multipliers.

### How to Play

- **Click/Tap** on falling modaks to collect them
- **Normal Modak** (🍬) → +10 points
- **Golden Modak** (✨) → +30 points (rare!)
- **Burnt Modak** (🔥) → -15 points (avoid!)
- **Danger** (💣) → -25 points (avoid!)
- Build **combos** by collecting consecutive valid modaks for score multipliers (x1 → x1.5 → x2 → x3)
- Difficulty increases over 30 seconds

### Controls

- Desktop: Mouse click
- Mobile: Touch/tap

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6, Framer Motion, Lucide React, Axios |
| Backend | Python, Flask, Flask-CORS, PyMongo |
| Database | MongoDB Atlas |

## Project Structure

```
Ganpati Blitz/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API client
│   │   ├── utils/         # Storage helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   └── package.json
├── backend/           # Flask API
│   ├── app.py
│   ├── wsgi.py
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Local Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:3000

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Runs on http://localhost:5000

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000
```

### Backend (.env)

```
MONGO_URI=mongodb://localhost:27017/ganpati_blitz
SECRET_KEY=your-secret-key
FLASK_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=5000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/player` | Create/get player profile |
| POST | `/api/games/modak-rush/score` | Submit game score |
| GET | `/api/games/modak-rush/best/:player_id` | Get personal best |
| GET | `/api/games/modak-rush/leaderboard` | Get leaderboard (`?campus=`, `?limit=`) |
| GET | `/api/profile/:player_id` | Profile, progression, and best scores |
| GET | `/api/stats/:player_id` | Recorded player statistics |
| GET | `/api/achievements/:player_id` | Achievement catalog and unlocks |
| GET | `/api/daily-challenge` | Server-date daily challenge |
| POST | `/api/daily-challenge/complete` | Claim a validated daily reward once |

## Database Collections

- **players**: `player_id`, `display_name`, `campus`, `created_at`
- **game_scores**: `player_id`, `game_id`, `score`, `duration`, `created_at`
- **player_progress**: XP, level-derived progress, streak fields
- **xp_events**: idempotent reward events
- **player_achievements**: unlocked achievement records
- **daily_completions**: one completion per player/challenge date

## Deployment

- **Frontend**: Vercel
- **Backend**: Render / Railway / Fly.io
- **Database**: MongoDB Atlas

For production, set `FLASK_ENV=production`, a strong `SECRET_KEY`, the Atlas `MONGO_URI`, `ALLOWED_ORIGINS` to the deployed frontend origin, and `VITE_API_URL`/`VITE_SOCKET_URL` to the deployed backend URL. Do not commit `.env` files.

## Verification Commands

```bash
cd frontend
npm run build

cd ../backend
python -m py_compile app.py services/progression.py
```

`pytest` is not currently included in the repository environment; install a test runner before executing automated backend tests.

## Contest Requirements Covered

- Ganesh Chaturthi theme (modaks, diyas, festive colors)
- Functional 30-second game with scoring
- Clear objective understood in seconds
- Working combo system
- Game ends properly with result screen
- Personal best tracking
- Campus-filtered leaderboard
- Mobile and desktop responsive
- No unnecessary personal data collected
- Score validation on backend
- Graceful error handling
- Play again flow
- Lord Ganesha represented respectfully (festive elements, not gameplay targets)
