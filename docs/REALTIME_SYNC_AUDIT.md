# Doodle Arena — Real-Time Synchronization Audit (Phases 0–4)
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** Real-Time Networking & Protocol Architecture Team  
**Scope:** Socket.IO Event Contracts, Packet Ordering, Mid-Match Synchronization, Reconnection Handshakes, Latency Mitigation

---

## 1. Executive Summary

Doodle Arena utilizes WebSockets via Socket.IO to power low-latency multiplayer drawing, guessing, and room operations.

This audit evaluates the bidirectional packet flow, identifies gaps in mid-match snapshot synchronization, diagnoses event race conditions, and establishes a robust protocol for reconnection and spectator catch-up.

---

## 2. Event Contract Inventory

### 2.1 Server-to-Client Events

| Event Name | Payload Signature | Purpose | Trigger Condition |
|---|---|---|---|
| `session:init` | `{ socketId: string, serverTime: number }` | Establish initial handshake & clock offset | On socket connection |
| `room:state` | `RoomState` | Full room synchronization | Any room state change |
| `word:options` | `{ options: WordOption[], durationSeconds: number }` | Deliver 3 word choices to drawer | At start of `WORD_SELECTION` |
| `word:hint` | `{ clue: string }` | Progressive clue reveal | At 50% and 75% elapsed drawing time |
| `drawing:turnStart` | `{ turnId: string, drawerId: string, strokes: [] }` | Authoritative canvas wipe & turn init | On turn rotation |
| `drawing:stroke` | `Stroke` | Stream live stroke | Broadcast when drawer completes stroke |
| `drawing:undo` | `{ strokeId: string }` | Remove stroke from canvas | Drawer triggers undo |
| `drawing:redo` | `{ stroke: Stroke }` | Restore undone stroke | Drawer triggers redo |
| `drawing:cleared` | `{}` | Wipe all strokes | Drawer clicks clear canvas |
| `drawing:snapshot` | `{ strokes: Stroke[] }` | Full canvas recovery | On spectator join or player reconnection |
| `guess:correct` | `{ playerId, playerName, pointsEarned, rank, newTotalScore }` | Public celebration banner (word hidden) | Guesser enters exact match |
| `guess:success` | `{ points: number, word: string }` | Private point award to solver | Guesser enters exact match |
| `guess:close` | `{ guess: string, message: string }` | Private close-guess hint | Guesser within Levenshtein distance 1–2 |
| `chat:message` | `ChatMessage` | Live chat & public guess stream | On valid chat or incorrect guess |
| `ranked:queueStatus` | `{ status: string, position: number }` | Matchmaking queue feedback | On queue entry / update |
| `ranked:matchFound` | `{ roomCode: string }` | Matchmaking success redirect | On 2-player match formation |

---

### 2.2 Client-to-Server Events

| Event Name | Payload Signature | Authority Verification |
|---|---|---|
| `room:create` | `{ playerName, avatar, settings, customCode }` | Open |
| `room:join` | `{ roomCode, playerName, avatar }` | Room capacity & state check |
| `spectator:join` | `{ roomCode }` | Room existence check |
| `player:ready` | `{ roomCode, isReady: boolean }` | Player must be member of room |
| `room:settingsUpdate` | `{ roomCode, settings: Partial<RoomSettings> }` | Host verification required |
| `game:start` | `{ roomCode }` | Host verification & min 2 players required |
| `word:select` | `{ roomCode, word: string }` | Active drawer verification required |
| `drawing:stroke` | `{ roomCode, stroke: Stroke }` | `playerId === room.currentDrawerId` & `phase === 'DRAWING'` |
| `drawing:undo` | `{ roomCode }` | `playerId === room.currentDrawerId` & `phase === 'DRAWING'` |
| `drawing:redo` | `{ roomCode }` | `playerId === room.currentDrawerId` & `phase === 'DRAWING'` |
| `drawing:clear` | `{ roomCode }` | `playerId === room.currentDrawerId` & `phase === 'DRAWING'` |
| `guess:submit` | `{ roomCode, text: string }` | Non-drawer & has not guessed correctly yet |
| `chat:message` | `{ roomCode, text: string }` | Room member verification & rate limit check |

---

## 3. Critical Synchronization Gaps Identified

### 3.1 Spectator Joining During Active Drawing
- **Defect:** In `server/index.ts:180–186`:
  ```ts
  socket.on('spectator:join', (data) => {
    const { roomCode } = data || {};
    const result = roomManager.joinAsSpectator(socket, roomCode);
    if (!result.success) {
      socket.emit('room:joinError', { error: result.error });
    }
  });
  ```
  `joinAsSpectator()` joins the socket to the room and emits `room:state`.
  However, it **never emits `drawing:snapshot`** containing the active strokes!
  As a result, a spectator joining an in-progress round sees an empty canvas until the drawer creates a new stroke.
- **Resolution:**
  In `RoomManager.joinAsSpectator()`:
  ```ts
  socket.emit('drawing:snapshot', { strokes: room.strokes });
  ```

### 3.2 Mid-Turn Reconnection Recovery
- **Defect:** If a player experiences a transient network disconnect and reconnects to the room, `strokes` are lost on the client reload.
- **Resolution:**
  Whenever a socket joins or reconnects to an active room in phase `DRAWING` or `ROUND_RESULT`, immediately dispatch `drawing:snapshot` with the room's current strokes array.

---

## 4. Latency, Throttling & Packet Ordering

### 4.1 Stroke Granularity Architecture
- In `DrawingCanvas.tsx`, strokes are completed upon `pointerup` with the full array of captured points:
  ```ts
  const stroke: Stroke = {
    id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tool: currentTool,
    color: currentColor,
    size: currentBrushSize,
    points: [...pts],
    seq: Date.now(),
  };
  ```
- This architecture prevents network congestion and eliminates packet-ordering artifacts because each stroke is an atomic geometric primitive.
- To ensure responsive guesser rendering during prolonged continuous strokes, the canvas also handles live point streaming when stroke points exceed 30 points.

### 4.2 Clue Hint Timing Synchronization
- Clue hints are computed and emitted authoritatively by the server in `RoomManager.ts`:
  - 50% elapsed time: 25% of word letters revealed.
  - 75% elapsed time: 50% of word letters revealed.
- Hint packets are broadcast via `word:hint { clue }` to ensure all clients reveal identical letters at the identical second.
