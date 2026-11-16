# Doodle Arena — Interaction & Screen Audit (Phases 0–4)
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** UI/UX & Interaction Engineering Team  
**Scope:** 8 Stitch-Designed Screens, Modals, Component States, User Inputs, Empty States, Accessibility

---

## 1. Executive Summary

This document performs an exhaustive audit of all eight core screens designed in the Stitch design system, along with modal dialogs, drawer toolbars, interactive canvas elements, and form inputs.

Each screen is evaluated for functional readiness, data binding truthfulness, responsive adaptability, and empty-state resilience.

---

## 2. Screen-by-Screen Interaction Inventory

### Screen 01: Homepage & Main Lobby (`MainLobbyView.tsx`)
- **Stitch Design Reference:** `doodle_arena_homepage_main_lobby`
- **Component Audit:**
  - **Avatar Customization Card:**
    - Style cycle buttons (cat, fox, robot, monkey, panda, bear): Fully operational.
    - Hat cycle buttons (none, beret, headphones, crown, cap, sunglasses): Fully operational.
    - Color swatch palette (6 vibrant swatches): Fully operational.
    - "Surprise Me" (randomize all): Functional, randomly picks valid avatar configuration.
  - **Player Name Input:**
    - Live edit input with local storage persistence: Operational.
    - Dice "Roll Name" button: Operational.
  - **Join Room By Code Form:**
    - Room code input (`#ROAR-409` format) with uppercase auto-transform: Operational.
    - "Paste" button using `navigator.clipboard.readText()`: Operational.
    - Submit trigger: Calls `handleJoinRoom(code)`.
  - **Matchmaking Launch Deck:**
    - Big 3D "PLAY CASUAL" CTA button: Operational, creates casual room or enters matchmaking.
    - Online presence counter: Currently fabricated (`14,820`). Needs truthful socket count.
    - Queue speed badge: Currently hardcoded (`Avg. queue: 1.8s`). Needs dynamic calculation.
  - **Game Mode Cards:**
    - Ranked Arena card: Navigates to Screen 06.
    - Word Fiesta / Custom Room card: Opens private room creation modal.
    - Team Duel card: Navigates to competitive hub.
  - **Weekly Top Doodlers Mini-Leaderboard:**
    - Hardcoded cards (`DoodleQueen`, `NeonSketcher`, `BananaCanvas`).
    - Needs dynamic query to `/api/leaderboard` with truthful fallback empty state.
  - **Community Spotlight Card:**
    - Hardcoded `3,400 times` counter. Needs truthful query or static curated challenge banner.

---

### Screen 02: Multiplayer Room Lobby (`RoomLobbyView.tsx`)
- **Stitch Design Reference:** `doodle_arena_multiplayer_room_lobby`
- **Component Audit:**
  - **Header Bar:** Room code with one-click copy button, privacy badge (`PUBLIC` / `PRIVATE`), player count counter (`X/8`).
  - **Player Roster Grid:**
    - 8 slots displaying active players with avatar previews, host crowns, and ready status badges.
    - Empty slots show "Waiting for doodler..." with pulse animation.
  - **Lobby Action Bar:**
    - "Ready / Not Ready" toggle button: Emits `player:ready`. Operational.
    - "Start Game" button: Visible only to host; enabled when $\ge 2$ players are in room.
    - "Invite Friends" button: Copies full sharable URL to clipboard with toast notification.
    - "Add AI Bot" button: Instantly adds `DoodleBot_AI` player for solo testing or filling slots.
  - **Host Room Settings Modal:**
    - Max players (2–16), Rounds (2–10), Draw Time (30s, 60s, 80s, 120s), Word Pack selector, Private room toggle.
    - Host settings updates correctly emit `room:settingsUpdate` to server.

---

### Screen 03: Gameplay Drawer View (`DrawerView.tsx`)
- **Stitch Design Reference:** `doodle_arena_gameplay_drawer_view`
- **Component Audit:**
  - **Top HUD:**
    - Round indicator: `Round X of Y`.
    - Authoritative Circular Timer (`GameTimer.tsx`): Animates smoothly with SVG stroke-dashoffset based on server `timerStart` and `timerEnd`.
    - Secret Word Banner: Prominently displays the drawer's chosen mystery word, difficulty badge, and point value.
  - **Interactive Canvas (`DrawingCanvas.tsx`):**
    - Smooth pointer event capture with logical 1200×900 coordinate translation.
  - **Drawing Toolbar (`DrawingToolbar.tsx`):**
    - Tools: Brush, Eraser, Line, Rectangle, Circle, Fill.
    - Color Palette: 12 vibrant tactile color swatches with active selection rings.
    - Brush Size Selector: 4 ergonomic presets (4px Fine, 8px Normal, 16px Bold, 28px Chunky).
    - Quick Action Buttons: Undo, Redo, Clear Canvas (with confirmation safeguard).
  - **Live Scoreboard Sidebar:** Displays all room players sorted by score with live ranks.
  - **Live Guess / Chat Stream:** Color-coded chat log showing correct answers, close guesses, and chat.

---

### Screen 04: Gameplay Guesser View & Word Select (`GuesserView.tsx`)
- **Stitch Design Reference:** `doodle_arena_gameplay_guesser_view_word_select`
- **Component Audit:**
  - **Word Selection Overlay Modal:**
    - Triggered during `WORD_SELECTION` phase.
    - Displays 3 tiered word cards (Easy +100 PTS, Medium +200 PTS, Hard +350 PTS) with 15-second countdown bar.
    - Visible to the active drawer for selection; guessers see "Drawer is choosing a mystery word...".
  - **Guesser HUD:**
    - Active drawer name and avatar.
    - Masked Clue Letters Banner: Displays letter slots (`_ _ _ _`) and reveals letter hints at 50% and 75% elapsed time.
  - **Mirrored Drawing Canvas:**
    - Non-interactive mode displaying live strokes.
    - Overlaid Zoom toggle (`1x` / `1.3x`).
    - Artwork Like Button: Emits `drawing:like` with heart burst animation.
  - **Guess Submission Bar:**
    - Form with text input and submit button.
    - Disabled once player has guessed correctly, replaced with celebration card:
      `"You guessed the word! +X Points earned"`.

---

### Screen 05: Final Scoreboard & Podium Celebration (`ScoreboardView.tsx`)
- **Stitch Design Reference:** `doodle_arena_final_scoreboard_podium_celebration`
- **Component Audit:**
  - **3D Championship Podium:**
    - 1st Place (Gold center pillar, crown badge, confetti burst).
    - 2nd Place (Silver left pillar).
    - 3rd Place (Bronze right pillar).
  - **Comprehensive Match Results Table:**
    - Full ranking table displaying rank, player avatar, nickname, final score, correct guesses, and ELO gain/loss.
  - **Match Artwork Showcase Gallery:**
    - Carousel displaying every drawing created during the match, drawer credit, secret word, and like tally.
  - **Rematch Voting Bar:**
    - "Vote Rematch (X/Y)" button: Emits `room:voteRematch`.
    - "Return to Lobby" button: Returns player cleanly to main lobby.

---

### Screen 06: Competitive Ranked Arena Hub (`CompetitiveArenaView.tsx`)
- **Stitch Design Reference:** `doodle_arena_competitive_arena_ranked_hub`
- **Component Audit:**
  - **Player ELO & Rank Tier Card:**
    - Truthful rank tier badge (Unranked -> Bronze -> Silver -> Gold -> Platinum -> Diamond -> Master).
    - ELO progress bar showing points to next tier.
  - **1v1 Fast Queue Matchmaking:**
    - "FIND 1V1 RANKED MATCH" CTA button.
    - Live matchmaking search overlay displaying elapsed search time and cancel button.
  - **Recent Match History Table:**
    - Lists recent competitive battles retrieved from `/api/competitive/battles`.

---

### Screen 07: Tournament Bracket & Match Schedule (`TournamentView.tsx`)
- **Stitch Design Reference:** `doodle_arena_tournament_bracket_match_schedule`
- **Component Audit:**
  - **16-Player Single Elimination Bracket Tree:**
    - Round of 16 (8 matches), Quarterfinals (4 matches), Semifinals (2 matches), Grand Finals (1 match).
    - Interactive match nodes showing player avatars, seedings, scores, and status (`LIVE`, `FINISHED`, `UPCOMING`).
  - **Tournament Registration Modal:**
    - Allows players to register their custom tag and nickname via `/api/tournament/register`.

---

### Screen 08: Spectator Live View & Stream (`SpectatorView.tsx`)
- **Stitch Design Reference:** `doodle_arena_spectator_live_view_stream`
- **Component Audit:**
  - **Live Canvas Broadcast:** Replicates live drawing canvas with real-time stroke streaming.
  - **Spectator Presence Badge:** Displays live spectator count.
  - **Spectator Reaction Bar:** Floating emoji reactions (👏, ❤️, 😂, 🔥, 🏆) that animate across the screen.
  - **Spectator Chat:** Dedicated chat stream allowing observers to converse without spoiling answers to active players.

---

## 3. Secondary Modals & Dialogues

| Modal | Trigger | Features | Status |
|---|---|---|---|
| **Player Profile Modal** | Click user badge in header | Avatar preview, level, XP, match stats, achievements, badge unlocks | Operational |
| **Game Settings Modal** | Click gear icon in header | Audio FX volume, music volume, high-contrast mode, show grid toggle | Operational |
| **How to Play / Help Modal** | Click `?` icon in header | Game rules, drawing etiquette, scoring breakdown, keyboard shortcuts | Operational |
| **Host Settings Modal** | Click gear icon in Room Lobby | Max players, round duration, total rounds, difficulty, word pack | Operational |

---

## 4. Interaction Audit Conclusion

All 8 Stitch-designed screens are implemented and structurally faithful to the design tokens. The interactive components are robust, with the critical fixes focused on:
1. Connecting live socket data to online counters and queue latency.
2. Initializing guest sessions with clean starting stats (`Level 1`, `0 XP`, `Unranked`).
3. Feeding dynamic database results into leaderboard components with truthful empty states.
