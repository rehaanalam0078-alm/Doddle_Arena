# Doodle Arena: Voice Communication Privacy & Trust Framework

## 1. Privacy Principles

Doodle Arena adheres to five core privacy and trust principles regarding voice communication:

1. **Zero Eavesdropping / No Recording:**
   Voice audio packets travel directly between players' browsers over peer-to-peer WebRTC connections. No audio is ever recorded, transcribed, sampled, or stored on backend servers or databases.
2. **Strict Public Isolation:**
   Casual public lobbies, ranked competitive queues, and tournament matches never expose voice chat. Public players will never be prompted for microphone permissions or subjected to unsolicited audio.
3. **Explicit Dual-Layer Consent:**
   - **Layer 1 (Host Level):** The host must explicitly enable voice chat in private room settings.
   - **Layer 2 (Player Level):** Each player must voluntarily click "Join Voice" before any browser microphone access is requested.
4. **Hardware-Level Mute Guarantees:**
   Clicking Mute disables the `MediaStreamTrack` (`track.enabled = false`), ensuring the browser stops encoding and sending audio packets at the hardware layer.
5. **Immediate Stream Destruction:**
   Navigating away from the room, closing the tab, or disconnecting immediately invokes `track.stop()`, turning off the browser microphone indicator hardware LED.

---

## 2. Server Authorization & Access Controls

The backend `VoiceManager` (`server/voice/VoiceManager.ts`) enforces strict authorization guards prior to processing any signaling messages:

```typescript
// Guard 1: Room existence
if (!room) return reject('Room not found.');

// Guard 2: Public room prohibition
if (!room.settings.isPrivate) {
  return socket.emit('voice:error', {
    message: 'Voice communication is strictly prohibited in public rooms.'
  });
}

// Guard 3: Feature enablement
if (!room.settings.voiceChatEnabled) {
  return socket.emit('voice:error', {
    message: 'Voice chat is disabled for this private room.'
  });
}

// Guard 4: Active room player membership
const playerId = room.socketToPlayerId.get(socket.id);
if (!playerId || !room.players.has(playerId)) {
  return reject('Unauthorized socket.');
}
```

---

## 3. Compliance & Security Summary

| Feature / Concern | Implementation Safeguard |
| :--- | :--- |
| **Microphone Permission Timing** | Triggered only upon user clicking "Join Voice" button. Never on page load. |
| **Data in Transit** | Encrypted via WebRTC DTLS/SRTP peer-to-peer protocols. |
| **Audio Data at Rest** | None. Zero audio persistence. |
| **Spectator Access** | Spectators cannot join private room voice channels. |
| **Parental / Host Control** | Hosts can terminate voice chat room-wide at any time with instantaneous effect. |
