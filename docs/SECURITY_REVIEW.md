# Security Review & Anti-Cheat Specifications — Doodle Arena

---

## 1. Threat Modeling & Attack Vectors

| Attack Vector | Vulnerability Risk | Server-Authoritative Countermeasure |
| :--- | :--- | :--- |
| **Secret Word Sniffing** | Guessers inspecting WebSocket frames, devtools, or local storage | The secret word is strictly excluded from all room-wide packets and guesser payloads. Only length, category, and masked underscores (`_ _ _`) are sent until round completion. |
| **Unauthorized Drawing** | Non-drawers sending forged `drawing:stroke` socket events | The server validates `socket.id === room.currentDrawerSocketId` for every incoming stroke. Unauthorized strokes are discarded immediately. |
| **Guess Tampering / Scripting** | Client fabricating instant correct guesses or score values | Scores are calculated purely on the server using authoritative timestamps (`Date.now() - roundStartTime`). The client cannot send score values. |
| **Chat Flood & Spam** | Scripted bots spamming chat room or guessing engine | Token bucket rate limiting (max 3 guesses/sec, max 5 chat messages/sec). Identical consecutive guesses throttled. |
| **Host Privilege Escalation**| Normal player emitting `game:start` or `room:settingsUpdate` | Server checks `room.hostId === player.id`. Unauthorized attempts emit an error and are dropped. |
| **Spectator Ghosting / Cheating**| Spectator revealing word to a friend playing in the room | Default ranked rooms enforce secret word masking for all spectators. Casual rooms provide a voluntary spoiler shield. |
| **XSS & Injection** | Malicious script payloads in nicknames or chat | All strings sanitized on server input; text rendered using React JSX safe text binding; HTML injection blocked. |
