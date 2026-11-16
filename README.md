# Doodle Arena 🎨

Doodle Arena is an authoritative, real-time multiplayer drawing-and-guessing party game built with React, TypeScript, Tailwind CSS, Vite, Node.js, Express, and Socket.IO.

Inspired by the fun of Skribbl.io, Doodle Arena introduces an original tactile visual identity, server-authoritative state machines, vector stroke streaming, Levenshtein guess evaluation, competitive ranked matchmaking, and live spectator broadcasting.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Runs both the backend Socket.IO server (port 3001) and Vite dev server (port 5173):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build & Execution
```bash
npm run build
npm start
```
Starts the full-stack server serving the production build on [http://localhost:3001](http://localhost:3001).

### 4. Run Test Suite
```bash
npm test
```
Runs 15 automated unit and end-to-end multi-socket integration tests via Vitest.

---

## 🎯 Primary Screens & Features

- **Screen 01: Homepage & Main Lobby** — Doodler Identity Avatar Studio, Surprise Me randomizer, quick invite code pass, Play Casual, Competitive Arena, and Bento game modes.
- **Screen 02: Multiplayer Room Lobby** — Live player roster, host controls (Rounds, Timers, Difficulty, Custom Wordpack), room link sharing, live lobby chat, and ready toggle.
- **Screen 03: Gameplay: Drawer View** — 3-column gameplay arena with normalized 1200x900 canvas, docked toolbelt (brush, eraser, fill bucket, shapes, 4 sizes), color palette swatches, authoritative undo/redo/clear, and locked chat.
- **Screen 04: Gameplay: Guesser View** — Live mirrored canvas, top word clue mask, zoom/like controls, 3-card mystery word selection overlay, close-guess amber alert, and correct solve celebration banner.
- **Screen 05: Final Scoreboard & Podium** — 1st, 2nd, 3rd position victory podium, confetti particles, full match standings table, artwork gallery carousel, and rematch voting.
- **Screen 06: Competitive Arena & Ranked Hub** — Gold II tier card, ELO progress bar, calibrated ranked queue matchmaking, recent battles history, and match replay scrubber.
- **Screen 07: Tournament Bracket & Match Schedule** — Summer Masters Cup bracket (QF, Semifinals, Grand Finals), live match cards with one-click spectate button, and cup registration.
- **Screen 08: Spectator Live View & Stream** — Live canvas stroke feed, spoiler mask toggle, floating cheer reactions (🔥, 👏, 🎨), theater mode, alignment grid, and viewer prediction poll.

---

## 📚 Documentation Reference

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Stitch Source Map](docs/STITCH_SOURCE_MAP.md)
- [Design Tokens](docs/DESIGN_TOKENS.md)
- [Screen Implementation Map](docs/SCREEN_IMPLEMENTATION_MAP.md)
- [Interaction Inventory](docs/INTERACTION_INVENTORY.md)
- [Real-Time Event Protocol](docs/REALTIME_EVENT_PROTOCOL.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Security Review](docs/SECURITY_REVIEW.md)
- [Test Plan](docs/TEST_PLAN.md)
- [QA Results](docs/QA_RESULTS.md)
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md)
- [Environment Audit](docs/ENVIRONMENT_AUDIT.md)
