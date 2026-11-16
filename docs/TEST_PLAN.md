# Comprehensive Test Plan — Doodle Arena

---

## 1. Unit Testing Suite

1. **Scoring Logic (`ScoringService.test.ts`)**:
   - Verification of base points by difficulty: Easy (100 pts), Medium (250 pts), Hard (450 pts).
   - Time-decay curve: faster guesses receive up to 100% bonus, decaying linearly to 25% minimum.
   - Drawer compensation: drawer earns 50% of average guesser score if at least one player solves.
   - Duplicate prevention: player cannot guess multiple times in the same turn.
2. **Guess Normalization & Levenshtein Matching (`GuessService.test.ts`)**:
   - Case insensitivity (`"Flamingo" == "flamingo"`).
   - Whitespace trimming (`"  flamingo  "`).
   - Punctuation removal (`"roller-coaster" == "roller coaster"`).
   - Levenshtein close-guess threshold (`"flamingg"` gives "Close!" warning).
3. **Word Selection & Hint Generation (`WordService.test.ts`)**:
   - Random selection of 3 tiered options from wordpack.
   - Reveal hint algorithm generates 25% and 50% masked letter reveals without leaking full answer.
4. **Room Capacity & Permissions (`RoomManager.test.ts`)**:
   - Prevents joining full room (`maxPlayers` exceeded).
   - Validates host transfer on host disconnect.

---

## 2. Real-Time Integration Testing Suite

1. **Multi-Socket Game Loop Flow**:
   - Client A (Host) creates room -> receives `room:created` with unique code `#ROAR-xxx`.
   - Client B joins with code -> receives `room:joined`; Client A receives `player:joined`.
   - Client A & B set ready status -> host initiates `game:start`.
   - Server transitions to `COUNTDOWN` -> `WORD_SELECTION`.
   - Client A (Drawer) receives 3 words; Client B receives waiting state.
   - Client A selects word -> server transitions to `DRAWING`.
   - Client A sends stroke events -> Client B receives mirrored stroke events.
   - Client B guesses word correctly -> server emits `guess:correct`, updates scores, transitions round when timer expires.
   - Victory podium screen renders final rankings.
2. **Spectator Connection**:
   - Client C joins running match as spectator -> receives canvas stroke history snapshot and current authoritative timer.

---

## 3. End-to-End Verification Checklist

- [x] Room creation with custom settings (rounds, timers, packs).
- [x] Room code clipboard copy & link generation.
- [x] Responsive layout across Desktop (3 columns), Tablet, and Mobile.
- [x] Canvas freehand brush, eraser, fill bucket, line, circle, rectangle tools.
- [x] Brush size options (4px, 8px, 16px, 32px) and color swatches.
- [x] Real-time stroke batching without frame drops.
- [x] Undo, Redo, and Clear Canvas with confirmation modal.
- [x] Authoritative timers and synchronized countdown rings.
- [x] Secret word protection and spoiler masking for spectators.
- [x] Victory podium with 1st, 2nd, 3rd places and rematch voting.
- [x] Competitive Arena matchmaking queue and rating logs.
- [x] Tournament visual bracket with live match spectating.
