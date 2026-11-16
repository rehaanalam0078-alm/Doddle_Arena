# Doodle Arena — Root Cause Analysis (Phases 0–4)
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** Principal Software Architect & QA Lead  
**Scope:** Root-Cause Analysis, Failure Mechanics, Impact Trees, Architectural Flaws

---

## 1. Executive Summary

This Root Cause Analysis (RCA) dissects the five primary failures confirmed during the system-wide diagnostic audit of Doodle Arena.

Each failure has been traced to its underlying architectural cause, code mechanism, triggering conditions, and systemic blast radius.

---

## 2. Root Cause Diagnoses

### RC-01: Fabricated Statistics & Fictitious Guest State
- **Primary Root Cause:**
  During the initial UI integration phase, placeholder design tokens and mockup values were hardcoded directly in React component initializers and Express route returns instead of binding to live data models or truthful fallback empty states.
- **Detailed Mechanics:**
  1. `server/index.ts:40` contained:
     `onlineArtists: 14820 + Math.floor(Math.random() * 50)`
     This was written as an aesthetic mock for the UI design review, completely ignoring `io.sockets.sockets.size`.
  2. `src/App.tsx:49–52` initialized guest state with:
     ```ts
     const [userLevel, setUserLevel] = useState(24);
     const [userXp, setUserXp] = useState(1420);
     const [userElo, setUserElo] = useState(1450);
     const [userRankTier, setUserRankTier] = useState('Gold II');
     ```
     This caused all new guest sessions to inherit high-tier progression rather than starting clean at Level 1, 0 XP, and Unranked.
  3. `src/views/MainLobbyView.tsx:630–700` embedded static HTML blocks depicting "DoodleQueen", "NeonSketcher", and "BananaCanvas" with static point values (`18,420`, `16,190`, `14,880`), bypassing the real database API.
- **Systemic Blast Radius:**
  High. Violates data integrity, confuses new players, and prevents legitimate players from recognizing their actual progression.

---

### RC-02: Drawing Canvas Retaining Historical Strokes Between Turns
- **Primary Root Cause:**
  Architectural asymmetry in turn-reset event emission between the server-side room controller and client-side React rendering state.
- **Detailed Mechanics:**
  1. In `RoomManager.ts:startWordSelection()`, the server executes:
     ```ts
     room.strokes = [];
     room.undoneStrokes = [];
     ```
     This cleans server memory. However, the server only emits `room:state` to the room. It **never emits `drawing:cleared`** or `drawing:turnStart` to inform connected sockets that the canvas must be wiped!
  2. In `src/App.tsx`, the `room:state` socket listener updates room metadata (`roomCode`, `currentRound`, `currentDrawerId`), but **does not touch `strokes` state**:
     ```ts
     socket.on('room:state', (state: RoomState) => {
       setRoomState(state);
       // strokes array is completely untouched!
     });
     ```
  3. `DrawingCanvas.tsx` renders whatever strokes are passed in via its `strokes` prop.
  4. Because `strokes` in `App.tsx` was never emptied, `DrawingCanvas` continues to redraw all historical strokes from Turn 1 when Turn 2 starts.
- **Systemic Blast Radius:**
  Critical. Directly breaks the core drawing and guessing gameplay loop.

---

### RC-03: Next Player & AI Drawing Failure
- **Primary Root Cause:**
  Total omission of an AI stroke streaming engine and lack of a synchronized turn-initialization handshake.
- **Detailed Mechanics:**
  1. In `RoomManager.ts`, `DoodleBot_AI` is assigned `socketId: 'bot_socket'`.
  2. In `startWordSelection()`, the bot selects a word after a 1.5-second timer.
  3. In `startDrawingPhase()`, the server sets `room.phase = 'DRAWING'`, but contains **no stroke generation logic for bot drawers**:
     ```ts
     // RoomManager.ts:startDrawingPhase()
     // Authoritative Server Timer Tick Interval (1 Hz)
     room.timerInterval = setInterval(() => { ... });
     // NO BOT DRAWING CODE!
     ```
     The bot is selected as drawer, the room enters `DRAWING` phase, but zero strokes are ever created. Guessers stare at a blank screen for 80 seconds.
  4. For human players, because strokes lack turn scoping (`turnId`), when Turn 2 begins, incoming strokes from Player 2 are appended to the un-cleared Turn 1 strokes, creating a corrupted composite drawing.
- **Systemic Blast Radius:**
  Critical. Completely breaks solo play, bot-assisted multiplayer, and multi-turn human rotations.

---

### RC-04: Non-Atomic State Transitions & Timer Race Conditions
- **Primary Root Cause:**
  Lack of an atomic phase lock in `RoomManager.endRound()` allowing concurrent asynchronous triggers.
- **Detailed Mechanics:**
  1. `endRound()` can be invoked by:
     - The 1-second server interval tick when `remainingMs <= 0`.
     - The guess handler when `allGuessed === true`.
  2. If the final guesser answers correctly during the final second of the timer, both code paths execute in the same event-loop tick.
  3. Neither branch verifies that `room.phase === 'DRAWING'` before proceeding.
  4. Both branches invoke `setTimeout(..., 5000)`.
  5. After 5 seconds, both timeouts execute:
     - `room.drawerIndex` increments by 2 instead of 1.
     - One player is completely skipped.
     - `drawer.score` receives double reward points.
     - Duplicate artwork entries are written to `Database.ts`.
- **Systemic Blast Radius:**
  High. Leads to intermittent corrupted match states, broken turn orders, and duplicated scores.

---

### RC-05: Un-partitioned Chat & Guess Log Bleeding Across Turns
- **Primary Root Cause:**
  Lack of round and turn scoping in the `ChatMessage` data model.
- **Detailed Mechanics:**
  1. `room.messages` stores a flat list of up to 100 messages.
  2. Messages contain only `{ id, sender, text, type, timestamp }`.
  3. When a new turn starts, messages from the previous turn are neither cleared nor demarcated with a visual turn divider.
  4. Guesses for the old secret word remain visible in the active guess feed, causing confusion for players trying to guess the new secret word.
- **Systemic Blast Radius:**
  Medium. Causes UI clutter and degrades competitive clarity.

---

## 3. Summary of Root Cause Resolutions

| Root Cause ID | Resolution Strategy | Target Files |
|---|---|---|
| **RC-01** | Replace mock data with live socket metrics, truthful starting guest progression (Lvl 1, 0 XP, Unranked), and empty states for empty databases. | `server/index.ts`, `src/App.tsx`, `AppHeader.tsx`, `MainLobbyView.tsx`, `Database.ts` |
| **RC-02** | Implement authoritative `drawing:turnStart` event; ensure both server and client wipe strokes on turn change; add `turnId` to strokes. | `server/game/RoomManager.ts`, `src/App.tsx`, `DrawingCanvas.tsx`, `shared/types.ts` |
| **RC-03** | Implement an authentic procedural AI stroke streaming engine that generates sequenced vector strokes for `DoodleBot_AI` across the round duration. | `server/game/RoomManager.ts`, `server/game/BotDrawingEngine.ts` |
| **RC-04** | Introduce atomic phase locking in `endRound()` and cancel active intervals/timeouts. | `server/game/RoomManager.ts` |
| **RC-05** | Attach `turnId` and `roundNumber` to messages; add visual turn dividers and filter active guesses to the current turn. | `server/game/RoomManager.ts`, `src/App.tsx`, `DrawerView.tsx`, `GuesserView.tsx` |
