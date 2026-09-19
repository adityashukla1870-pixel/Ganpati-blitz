# Ganpati Blitz QA Checklist

## Automated checks

- [x] Frontend production build passes with `npm run build`.
- [x] Backend compiles with `python -m py_compile app.py services/progression.py`.
- [x] Backend imports without module errors.
- [ ] Browser smoke tests at 320px, 375px, 414px, tablet, desktop, and large desktop.
- [ ] MongoDB-backed API integration tests.
- [ ] Two-client Socket.IO multiplayer test.

## Manual flows

- [ ] New player setup with valid display name and campus.
- [ ] Returning player profile and local session restore.
- [ ] Launch and finish each of the six solo games.
- [ ] Score, personal best, result, replay, and per-game leaderboard.
- [ ] Friend room creation, join, ready, countdown, result, and rematch.
- [ ] Quick Match success, timeout, cancel, and reconnect.
- [ ] Daily Challenge completion and duplicate claim rejection.
- [ ] Blitz Mix six-round completion, `/600` result, and `+50 XP` response.
- [ ] Profile, achievements, statistics, XP bar, and streak display.

## Responsive and accessibility checks

- [ ] No horizontal overflow at 320px width.
- [ ] All primary controls are usable with touch.
- [ ] Keyboard can reach navigation, forms, buttons, and links.
- [ ] Focus indicators remain visible.
- [ ] Results communicate text as well as color.
- [ ] Audio is optional and never required.
- [ ] `prefers-reduced-motion` behavior reviewed.

## Release blockers to resolve before contest submission

- Multiplayer final scores still need server-side action validation rather than bounded client totals.
- Existing browser/device and two-client multiplayer tests have not been executed in this environment.
- Install and run a real test suite against a disposable MongoDB database.