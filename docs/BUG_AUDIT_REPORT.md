# Doodle Arena — Bug Audit Report (Phases 0–4)
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** Software Architecture & QA Diagnostic Team  
**Scope:** Full-Stack Architecture, Real-Time Networking, Game State Lifecycle, Canvas Engine, Client State Management

---

## 1. Executive Summary

A comprehensive, non-destructive diagnostic audit of the Doodle Arena application was performed across frontend components, real-time WebSocket protocol handlers, in-memory state models, REST API endpoints, and persistence layers.

The audit confirmed the presence of the two primary user-reported defects (Unrealistic Player Statistics and Canvas Not Resetting Between Turns), along with three critical secondary defects (Next Player & AI Drawing Not Displaying, State Transition / Timer Race Conditions, and Chat/Guess Bleed Across Turns).

Every confirmed defect has been classified according to severity, mapped to its exact code location, and assigned an authoritative root-cause classification.

---

## 2. Defect Classification Framework

- **P0 (Blocker):** Fundamental gameplay failure preventing core game loop completion or multiplayer synchronization.
- **P1 (Critical):** Core gameplay degradation, visual corruption across turns, or fabricated user data violating data integrity.
- **P2 (Major):** Broken secondary feature, race condition under specific concurrency, or missing graceful empty states.
- **P3 (Minor):** Cosmetic defect, styling inconsistency, or unlocalized string.

---

## 3. Comprehensive Defect Inventory

### P0-01: Drawing Canvas Retains Previous Player Strokes Across Turns
- **Category:** Real-Time Multiplayer / Canvas Lifecycle
- **Severity:** P0 (Blocker)
- **Affected Files:**
  - `server/game/RoomManager.ts` (lines 386–414, 450–480)
  - `src/App.tsx` (lines 105–126, 133–151)
  - `src/components/canvas/DrawingCanvas.tsx` (lines 36–55)
- **Symptom:** When a turn expires or all guessers solve a word, the game advances to the next turn (or next round). The previous drawer's canvas artwork remains visible on both the new drawer's canvas and all guessers' screens.
- **Technical Finding:**
  - In `RoomManager.ts:startWordSelection()`, `room.strokes` is reset in server memory (`room.strokes = []`), but the server **never emits** a `drawing:cleared` event or an authoritative `drawing:turnStart` event to connected sockets.
  - In `src/App.tsx`, the `socket.on('room:state')` listener updates `roomState` but **never resets** the local `strokes` React state.
  - `DrawingCanvas.tsx` redraws whenever the `strokes` prop updates. Because `strokes` is never emptied, the canvas continues to render all accumulated historical strokes from previous turns.
  - Strokes lack a scoped `turnId`, allowing late-arriving strokes to be mixed into the new turn.

---

### P0-02: Next Player & AI Drawing Not Displaying
- **Category:** Multiplayer Turn Rotation / Bot AI Engine
- **Severity:** P0 (Blocker)
- **Affected Files:**
  - `server/game/RoomManager.ts` (lines 423–431, 450–488)
  - `src/App.tsx` (lines 114–126)
- **Symptom:**
  - When the turn advances to an AI bot (`DoodleBot_AI`), the bot selects a word after 1.5 seconds, but **never draws anything**. Guessers stare at an empty canvas for 80 seconds until the timer expires.
  - When rotating to a secondary human player, the canvas does not initialize cleanly, and stroke broadcasts between drawers and guessers fail to synchronize fresh snapshots.
- **Technical Finding:**
  - `RoomManager.ts` has no stroke generation or streaming engine for bot drawers. When `currentDrawerId` belongs to `bot_socket`, no strokes are ever emitted to the room.
  - For human drawers, the absence of a per-turn stroke snapshot exchange causes desynchronization if any packet is dropped or delayed.

---

### P1-01: Fabricated & Hardcoded Player Statistics on Client & Backend
- **Category:** Data Integrity / Session Management
- **Severity:** P1 (Critical)
- **Affected Files:**
  - `server/index.ts` (lines 40, 75–123)
  - `server/db/Database.ts` (lines 95–160)
  - `src/App.tsx` (lines 40–55)
  - `src/components/common/AppHeader.tsx` (line 22)
  - `src/views/MainLobbyView.tsx` (lines 25–35, 277, 630–720)
- **Symptom:**
  - The homepage displays "14,820 ARTISTS ONLINE" even when only 1 local client is connected.
  - The homepage displays "Avg. queue: 1.8s".
  - Fresh guest sessions default to `SpeedyPencil_99`, Level 24, 1,420 XP, Gold II (1,450 ELO).
  - Weekly Top Doodlers displays hardcoded mock players (DoodleQueen: 18,420 PTS, NeonSketcher: 16,190 PTS, BananaCanvas: 14,880 PTS).
  - Word of the Day displays hardcoded "doodled over 3,400 times".
- **Technical Finding:**
  - `server/index.ts:40` returns `14820 + Math.floor(Math.random() * 50)` instead of `io.sockets.sockets.size`.
  - `AppHeader.tsx` defaults `onlineCount` to `14820`.
  - `App.tsx` initial state defaults `userLevel` to `24`, `userXp` to `1420`, `userElo` to `1450`, and `userRankTier` to `'Gold II'`.
  - `MainLobbyView.tsx` hardcodes static HTML numbers for leaderboard players and queue metrics rather than querying authoritative backend APIs and rendering empty states when no data exists.

---

### P1-02: State Transition Race Conditions & Unbounded Timers
- **Category:** Game-State Authority / Concurrency
- **Severity:** P1 (Critical)
- **Affected Files:**
  - `server/game/RoomManager.ts` (lines 467–487, 625–636, 656–672, 708–726)
- **Symptom:** Intermittent double round advancement, duplicate score awards, or lingering timer intervals when all guessers solve a word at the exact moment the 1-second server timer tick expires.
- **Technical Finding:**
  - `RoomManager.endRound()` is called both by the 1-second interval (`remainingMs <= 0`) and by `handleGuess()` (`allGuessed && totalGuessers.length > 0`).
  - There is no atomic state lock or `isEndingRound` boolean guard. If both fire in rapid succession, two concurrent `setTimeout(..., 5000)` callbacks are scheduled, causing double turn rotation, double round increment, and corrupted drawer index offsets.

---

### P1-03: Chat & Guess History Bleed Across Turns and Rounds
- **Category:** Chat / Guess Feed
- **Severity:** P1 (Critical)
- **Affected Files:**
  - `server/game/RoomManager.ts` (lines 43, 581, 647, 652, 700)
  - `src/App.tsx` (lines 153–160)
  - `src/views/DrawerView.tsx` (lines 160–190)
  - `src/views/GuesserView.tsx` (lines 190–240)
- **Symptom:** Guesses, close alerts, and chat messages from previous rounds remain intermingled in the live chat log during the new round, confusing players and cluttering the active guess feed.
- **Technical Finding:**
  - Neither `ChatMessage` nor the client message feed tags messages with `turnId` or `roundNumber`.
  - No turn boundary delimiter or turn-scoped filter is applied when rendering active game guesses.

---

### P2-01: Undo / Redo Stack Not Turn-Scoped
- **Category:** Drawing Canvas State
- **Severity:** P2 (Major)
- **Affected Files:**
  - `server/game/RoomManager.ts` (lines 508–536)
  - `src/components/canvas/DrawingToolbar.tsx`
- **Symptom:** If an undo event arrives near a turn boundary, it can pop strokes from server memory without validating turn ownership.
- **Technical Finding:**
  - `undoneStrokes` and `strokes` arrays are cleared on the server on `startWordSelection()`, but there is no `turnId` validation on incoming `drawing:undo` or `drawing:redo` socket calls.

---

### P2-02: Spectator Mid-Game Stroke Desynchronization
- **Category:** Spectator Mode
- **Severity:** P2 (Major)
- **Affected Files:**
  - `server/game/RoomManager.ts` (lines 180–186, 300–325)
  - `server/index.ts` (lines 180–186)
- **Symptom:** When a spectator joins an ongoing match in `DRAWING` phase, the spectator receives `room:state`, but does not receive the active canvas strokes snapshot, resulting in a blank canvas until the drawer creates a new stroke.
- **Technical Finding:**
  - `RoomManager.joinAsSpectator()` joins the socket room and sends `room:state`, but does not emit `drawing:snapshot` containing current `room.strokes` directly to the new spectator socket.

---

### P3-01: Leaderboard & Word of the Day Missing Truthful Empty States
- **Category:** UI / UX Design System
- **Severity:** P3 (Minor)
- **Affected Files:**
  - `src/views/MainLobbyView.tsx`
  - `src/views/LeaderboardView.tsx`
- **Symptom:** When persistent database has zero match history, the UI displays seeded sample records without distinguishing them from genuine active leaderboard competition.
- **Technical Finding:**
  - Need explicit "No matches played this week — Be the first to claim Rank #1!" empty state component.

---

## 4. Defect Summary Table

| Defect ID | Description | Severity | Target Module | Status |
|---|---|---|---|---|
| **P0-01** | Canvas strokes retain previous player drawings across turns | P0 Blocker | Server / Canvas Client | Confirmed |
| **P0-02** | Next player and AI bot drawing not displaying | P0 Blocker | Bot Engine / Turn Manager | Confirmed |
| **P1-01** | Fabricated online count, queue time, player level, and leaderboard | P1 Critical | REST / State / DB | Confirmed |
| **P1-02** | State transition race condition on round completion | P1 Critical | RoomManager State Machine | Confirmed |
| **P1-03** | Chat and guess log bleeding across rounds/turns | P1 Critical | Chat / Guess Service | Confirmed |
| **P2-01** | Undo / Redo lacks authoritative turnId scoping | P2 Major | Canvas Event Handler | Confirmed |
| **P2-02** | Spectator joining mid-game misses current stroke snapshot | P2 Major | Spectator Handler | Confirmed |
| **P3-01** | Missing graceful empty states for leaderboard & analytics | P3 Minor | Views / Design System | Confirmed |
