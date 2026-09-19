# Ganpati Blitz Contest Readiness

## Project

Ganpati Blitz is a festive, fast-paced arcade platform where players compete across multiple short Ganesh Chaturthi-themed games, either solo or with friends.

## Gameplay loop

Choose a game from the Arcade, learn its one-line objective, play a short round, receive a result and personal best, then replay, inspect the per-game leaderboard, or challenge another player.

## Games

Modak Rush, Diya Dash, Dhol Battle, Rangoli Rush, Mushak Maze, and Ganpati Logic. Blitz Mix combines six short touch-first rounds into a separate normalized `/600` solo score.

## Features

- Solo games and replayable results
- Friend rooms and Quick Match using Socket.IO
- Per-game leaderboards with campus filtering
- Server-controlled XP and level progression
- Achievement catalog and unlock records
- Server-date Daily Challenge with one-time reward claim
- Player profile, statistics, and daily streak fields
- Responsive lazy-loaded game modules

## Technology

React 18, Vite, React Router, Framer Motion, Lucide, Axios, Flask, Flask-SocketIO, PyMongo, and MongoDB Atlas.

## Original design decisions

The product uses festival elements such as modaks, diyas, dhols, rangoli, mushak, saffron, gold, and dark arcade surfaces. Lord Ganesha is treated respectfully and is not used as a target or gameplay object. No paid mechanics, ads, gambling, or copyrighted media were added.

## Accessibility and mobile support

The games expose touch controls, large primary controls, readable labels, and text-based result states. Route-level loading states and API error messages are present. Manual device and keyboard QA remains outstanding and is tracked in [QA_CHECKLIST.md](QA_CHECKLIST.md).

## Verification status

Verified: frontend production build, backend compile, backend import, route-level diagnostics, server-side score bounds, session duplicate rejection for submitted session IDs, production origin configuration, and MongoDB index declarations.

Not fully verified: live MongoDB integration, real mobile browsers, large desktop layout, two-client multiplayer, reconnect edge cases, and authoritative action-level multiplayer anti-cheat.

## Deployment status

Deployment configuration is documented through `.env.example`, `wsgi.py`, Vite build scripts, and the README. A public deployment was not performed in this environment.

## Final checklist

- [x] Six games discoverable from the Arcade
- [x] Solo result and leaderboard paths exist
- [x] Progression and daily challenge APIs exist
- [x] Blitz Mix solo flow exists
- [x] Environment placeholders contain no real secrets
- [x] Production debug mode is environment-controlled
- [ ] Complete manual QA matrix
- [ ] Complete live multiplayer and mobile verification
- [ ] Verify official contest requirements against the official source