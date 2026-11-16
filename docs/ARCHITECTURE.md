# System Architecture — Doodle Arena

Doodle Arena is an authoritative real-time multiplayer drawing and guessing game designed for browser execution with zero external paid dependencies.

---

## 1. System Topology Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                │
│                                                                         │
│  React 18/19 + Vite + TypeScript + Tailwind CSS                        │
│  ┌──────────────────────┐ ┌────────────────────┐ ┌───────────────────┐  │
│  │ Navigation & Routes  │ │ Authoritative HUD  │ │ Canvas Engine     │  │
│  │ (Screens 01 - 08 +   │ │ (Timer, Scores,    │ │ (Freehand, Bucket,│  │
│  │ Modals & Overlays)   │ │  Player Roster)    │ │  Shapes, Undo)    │  │
│  └──────────┬───────────┘ └─────────┬──────────┘ └─────────┬─────────┘  │
│             │                       │                      │            │
│             └───────────────────────┼──────────────────────┘            │
│                                     ▼                                   │
│                        Socket.IO Client & Sound FX                      │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ WebSocket / WSS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS REAL-TIME BACKEND SERVER                     │
│                                                                         │
│  Express API + Socket.IO Server + Server-Authoritative State Engine     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       Event Validation & Auth                     │  │
│  └──────────────────┬─────────────────────────────┬──────────────────┘  │
│                     │                             │                     │
│         ┌───────────▼────────────┐    ┌───────────▼───────────┐         │
│         │ Room & Match Manager   │    │ Canvas Stroke Stream  │         │
│         │ (State Machine, Turns, │    │ (Batching, Throttling,│         │
│         │  Authoritative Timers) │    │  Undo/Redo, Snapshot) │         │
│         └───────────┬────────────┘    └───────────┬───────────┘         │
│                     │                             │                     │
│         ┌───────────▼────────────┐    ┌───────────▼───────────┐         │
│         │ Word Selection & Clues │    │ Guess & Chat Engine   │         │
│         │ (Tiered 3-words, Hints)│    │ (Levenshtein, Score)  │         │
│         └───────────┬────────────┘    └───────────┬───────────┘         │
│                     │                             │                     │
│         ┌───────────▼────────────┐    ┌───────────▼───────────┐         │
│         │ Competitive Matchmaker │    │ Tournament Engine     │         │
│         │ (Ranked ELO, Queues)   │    │ (Brackets, Feed)      │         │
│         └───────────┬────────────┘    └───────────┬───────────┘         │
│                     │                             │                     │
│                     └───────────────┬─────────────┘                     │
│                                     ▼                                   │
│                        Persistent Storage Engine                        │
│                     (SQLite Relational Schema / Data)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Authoritative Game State Machine

A room progresses through strict state transitions governed entirely by the backend server:

```
[ LOBBY / WAITING_FOR_PLAYERS ]
             │ (Host clicks Start / Minimum players ready)
             ▼
[ COUNTDOWN (3s) ]
             │ (Timer finishes)
             ▼
[ WORD_SELECTION (15s) ] ── (Drawer picks 1 of 3 words; auto-picks on timeout)
             │
             ▼
[ DRAWING / GUESSING (autorotating round timer 60s/80s/100s/120s) ]
             │ (All guessers correct OR round timer expires)
             ▼
[ ROUND_RESULT (5s) ] ── (Reveal word, award drawer & guesser points, show art)
             │
      ┌──────┴────────────────────────┐
 (More turns remaining)        (All rounds complete)
      │                               │
      ▼                               ▼
[ WORD_SELECTION (next drawer) ]   [ MATCH_RESULT / VICTORY PODIUM ]
                                      │
                                      ▼
                               [ REMATCH VOTING ] ──> [ LOBBY ]
```

---

## 3. Real-Time Drawing Synchronization Architecture

1. **Normalized Coordinate System**:
   - Canvas resolution is fixed internally to an authoritative logical coordinate space (`1200 x 900`, 4:3 aspect ratio).
   - Mouse, stylus, and touch inputs normalize client offsets `(clientX - rect.left) / rect.width * 1200`.
   - Drawing precision is completely independent of screen resolution, DPI scaling, and browser window resizing.
2. **Stroke Streaming & Batching**:
   - As a drawer paints, points are batched every 16ms (60 FPS) or on `pointerup`.
   - Each stroke operation has a unique sequence number `seq`, tool identifier (`brush`, `eraser`, `fill`, `line`, `rectangle`, `circle`), color, size, and point path `[{x, y}]`.
3. **Optimistic Local Drawing**:
   - The drawer renders strokes instantly locally while streaming the event to the server.
   - Guessers and spectators receive stroke events from the server and render them incrementally.
4. **Authoritative Undo/Redo/Clear**:
   - The server maintains the master stroke history list for each round.
   - When the drawer clicks Undo, the server pops the last stroke by that drawer and broadcasts `drawing:undo` with the stroke ID to remove.
   - When a spectator or reconnecting player joins mid-round, the server transmits the complete ordered stroke snapshot so their canvas reconstructs instantly.

---

## 4. Secret Word Security & Anti-Cheat

1. **Zero Secret Leaks**:
   - During `WORD_SELECTION` and `DRAWING`, the full secret word is only ever transmitted to the active drawer's socket.
   - Guessers receive only:
     - Word length (number of letters / words).
     - Category (e.g. `Animals & Nature`, `Everyday Objects`).
     - Point difficulty multiplier.
     - Timed hint reveals (e.g. `_ _ A _ _ N _ O` at 50% and 25% time remaining).
2. **Authoritative Guess Verification**:
   - Clients send raw text guesses `guess:submit`.
   - The server strips punctuation, trims whitespace, converts to lowercase, and compares against the canonical word.
   - Close-guess calculation: If the Levenshtein distance is `<= 1` or `<= 2` for longer words, the server broadcasts an amber "Close!" alert exclusively to the guessing player without revealing the word.
   - Correct guess: Upon exact match, the server marks the player as `hasGuessed = true`, awards points based on elapsed time, and broadcasts `guess:correct` concealing the word from remaining guessers until the round ends.
