# Real-Time Event Protocol — Doodle Arena

This document details the Socket.IO event contract between the Doodle Arena client and server.

---

## 1. Connection & Session Management

### `connect`
- **Transport:** WebSocket
- **Payload:** Query parameter `?token=<sessionId>` for reconnectable sessions.

### `session:init` (Server -> Client)
- **Payload:**
  ```json
  {
    "sessionId": "sess_98234ab12",
    "playerId": "ply_001",
    "serverTime": 1773729102450
  }
  ```

### `session:reconnect` (Client -> Server)
- **Payload:** `{ "sessionId": "sess_98234ab12" }`
- **Ack / Response:** Returns full current room state if session is still valid.

---

## 2. Room & Player Operations

### `room:create` (Client -> Server)
- **Payload:**
  ```json
  {
    "playerName": "SpeedyPencil_99",
    "avatar": { "style": "cat", "hat": "beret", "color": "#7C3AED" },
    "settings": {
      "isPrivate": true,
      "maxPlayers": 8,
      "rounds": 3,
      "drawTimeSeconds": 80,
      "difficulty": "medium",
      "wordPackId": "classic",
      "language": "en"
    }
  }
  ```
- **Response `room:joined`:** Full `RoomState` object.

### `room:join` (Client -> Server)
- **Payload:**
  ```json
  {
    "roomCode": "ROAR-409",
    "playerName": "NeonSketcher",
    "avatar": { "style": "robot", "hat": "headphones", "color": "#06B6D4" }
  }
  ```

### `room:leave` (Client -> Server)
- **Payload:** `{ "roomCode": "ROAR-409" }`

### `room:settingsUpdate` (Host Client -> Server)
- **Payload:** `{ "roomCode": "ROAR-409", "settings": { ... } }`
- **Server Broadcast:** `room:updated` (emitted to all room members).

### `player:ready` (Client -> Server)
- **Payload:** `{ "roomCode": "ROAR-409", "isReady": true }`
- **Server Broadcast:** `player:statusChanged`

---

## 3. Game Flow & Authoritative Turn State Machine

### `game:start` (Host Client -> Server)
- **Payload:** `{ "roomCode": "ROAR-409" }`
- **Validation:** Host check, min 2 players, all/ready check.
- **Server Broadcast:** `game:countdownStarted` `{ "duration": 3 }`

### `game:state` (Server -> Room)
- **Payload:**
  ```json
  {
    "state": "WORD_SELECTION" | "DRAWING" | "ROUND_RESULT" | "MATCH_RESULT",
    "round": 1,
    "totalRounds": 3,
    "drawerId": "ply_001",
    "drawerName": "SpeedyPencil_99",
    "timerStart": 1773729105000,
    "timerEnd": 1773729185000,
    "durationSeconds": 80
  }
  ```

### `word:options` (Server -> Active Drawer Only)
- **Payload:**
  ```json
  {
    "options": [
      { "word": "Pencil", "category": "Everyday Objects", "difficulty": "easy", "points": 100 },
      { "word": "Flamingo", "category": "Animals & Nature", "difficulty": "medium", "points": 250 },
      { "word": "Rollercoaster", "category": "Places & Rides", "difficulty": "hard", "points": 450 }
    ],
    "selectionTimeout": 15
  }
  ```

### `word:select` (Active Drawer -> Server)
- **Payload:** `{ "word": "Flamingo" }`
- **Server Action:** Starts `DRAWING` phase, reveals clue `_ _ _ _ _ _ _ _` (8 letters) to guessers.

### `word:hint` (Server -> Room Guessers)
- **Payload:**
  ```json
  {
    "clue": "F _ _ M _ _ _ O",
    "revealedCount": 3,
    "totalLetters": 8,
    "category": "Animals & Nature"
  }
  ```

---

## 4. Real-Time Drawing Sync

### `drawing:stroke` (Active Drawer -> Server)
- **Payload:**
  ```json
  {
    "id": "stk_89123",
    "tool": "brush" | "eraser" | "fill" | "line" | "rectangle" | "circle",
    "color": "#7C3AED",
    "size": 8,
    "points": [{ "x": 120.5, "y": 204.3 }, { "x": 124.0, "y": 210.1 }],
    "seq": 42
  }
  ```
- **Server Broadcast:** `drawing:stroke` (broadcast to all room sockets except sender).

### `drawing:undo` (Active Drawer -> Server)
- **Server Broadcast:** `drawing:undo` `{ "strokeId": "stk_89123" }`

### `drawing:redo` (Active Drawer -> Server)
- **Server Broadcast:** `drawing:redo` `{ "stroke": { ... } }`

### `drawing:clear` (Active Drawer -> Server)
- **Server Broadcast:** `drawing:cleared` `{}`

### `drawing:snapshot` (Server -> Reconnecting Player / Spectator)
- **Payload:** Full array of active strokes for the current round.

---

## 5. Guessing & Chat

### `guess:submit` (Guesser -> Server)
- **Payload:** `{ "guess": "flamingo" }`
- **Server Processing:**
  1. If player is active drawer -> rejected (`chat:system` "You are drawing!").
  2. If player already guessed correctly -> rejected.
  3. If normalized guess == normalized secret word -> broadcast `guess:correct` to room, award points.
  4. If Levenshtein distance <= 1 or 2 -> emit private `guess:close` to guesser.
  5. Otherwise -> broadcast normal chat message `chat:message`.

### `guess:correct` (Server -> Room)
- **Payload:**
  ```json
  {
    "playerId": "ply_002",
    "playerName": "NeonSketcher",
    "pointsEarned": 235,
    "rank": 2,
    "newTotalScore": 540
  }
  ```

---

## 6. Rematch & Spectator

### `rematch:vote` (Client -> Server)
- **Payload:** `{ "vote": true }`
- **Server Broadcast:** `rematch:status` `{ "votes": 3, "required": 4 }`

### `spectator:join` (Client -> Server)
- **Payload:** `{ "roomCode": "ROAR-409" }`
- **Server Response:** Synchronized match snapshot without revealing secret word if spoiler masking is active.

### `spectator:reaction` (Spectator Client -> Server)
- **Payload:** `{ "reaction": "clap" | "fire" | "masterpiece" | "mindblown" }`
- **Server Broadcast:** `spectator:burst` floating reaction badge.
