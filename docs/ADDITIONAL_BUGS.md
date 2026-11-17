# Additional Identified Bugs & Vulnerabilities

## 1. Game State Security & Access Control

### 1.1 Unauthenticated Word Selection (`word:select`)
- **Severity**: High
- **Description**: In `server/index.ts`, `socket.on('word:select')` invoked `roomManager.selectWord(room, data.word)` without verifying:
  1. That the sender's socket corresponds to `room.currentDrawerId`.
  2. That the room is currently in `WORD_SELECTION` phase.
  3. That the submitted word is one of the three authoritative options in `room.wordOptions`.
- **Exploit**: A malicious or laggy client could force arbitrary words or skip turns.
- **Remediation**: Add strict drawer identity, phase validation, and options inclusion checks.

### 1.2 Private Room Spectator Snooping
- **Severity**: High
- **Description**: `server/game/RoomManager.ts:joinAsSpectator` did not inspect `room.settings.isPrivate`.
- **Exploit**: Anyone knowing a 6-character room code could join private matches as a spectator and view the secret word and player chat without authorization.
- **Remediation**: Reject `spectator:join` if `room.settings.isPrivate` is true unless explicit private spectator access is enabled.

---

## 2. Competitive Matchmaking & Fake Player Injections

### 2.1 Demo Player Injections in Production
- **Severity**: Medium
- **Description**: `Database.ts` contained hardcoded seeds (`ply_seed_1` to `ply_seed_4`) that automatically populated `data/doodle_arena.json` whenever empty.
- **Impact**: Fictitious players (`DoodleQueen`, `NeonSketcher`) appeared in the public leaderboard and competitive service returned mock battles.
- **Remediation**: Gate demo seeding behind non-production environments or explicit development flags. Clean up production database file.

### 2.2 Simulated Ranked Matchmaking Delay
- **Severity**: Medium
- **Description**: `CompetitiveService` returned hardcoded `avgWaitSeconds: 1.8` and fake battle histories.
- **Remediation**: Implement a transparent queue state: notify players honestly when waiting for real opponents in ranked matchmaking.

---

## 3. Frontend & Build Diagnostics

### 3.1 Environment Variable Typing
- **Severity**: Low
- **Description**: `import.meta.env` lacked explicit TypeScript typings for `VITE_BACKEND_URL`, producing typing warnings.
- **Remediation**: Ensure `src/vite-env.d.ts` declares full `ImportMetaEnv` interfaces.
