# Root Cause Analysis: Critical System Defects

## 1. Defect #1: Room Exit Failure & Persistent Game Screen Reopening

### 1.1 Symptoms
When a player clicks "Leave Room" or navigates back to the Lobby during an active match:
1. The lobby appears temporarily.
2. When the round timer expires or a new drawer is selected, the match screen abruptly re-opens on the player's client.
3. The departed player continues to appear in the active player list on other players' screens.
4. If the departed player was the host, no host migration occurs, freezing match controls.

### 1.2 Root Cause Discovery & Call Graph Trace
- **Client Side (`src/App.tsx`)**:
  ```typescript
  // PREVIOUS FLAWED CODE in src/App.tsx
  const handleLeaveRoom = () => {
    setRoomState(null);
    setCurrentView('lobby');
  };
  ```
  - The function only set local component state.
  - No Socket.IO event (`room:leave`) was emitted.
  - No call to `voiceService.leave()` was made.
  - Global `socket.on('room:state', ...)` in `src/App.tsx` did not verify if the incoming event belonged to the active room session:
  ```typescript
  socket.on('room:state', (state: RoomState) => {
    setRoomState(state);
    if (state.phase === 'LOBBY') setCurrentView('lobby');
    else if (state.currentDrawerId === myPlayerId) setCurrentView('drawer');
    else setCurrentView('guesser');
  });
  ```
  When the server broadcast the next round or turn state to the room channel, the departed client received the message and automatically switched `currentView` back to `'drawer'` or `'guesser'`.

- **Server Side (`server/index.ts` & `server/game/RoomManager.ts`)**:
  - `server/index.ts` contained no listener for `room:leave`.
  - `RoomManager` had no public `leaveRoom(socket, roomCode)` method.
  - The socket was never removed from `room.socketToPlayerId` nor removed from the Socket.IO room channel (`socket.leave(roomCode)`).
  - The player remained listed in `room.players`.

---

## 2. Defect #2: WebRTC Voice Communication Silence / Failure

### 2.1 Symptoms
Players in private rooms enabling voice chat could not hear audio from other participants, or experienced one-way audio where only one peer could transmit.

### 2.2 Root Cause Analysis
1. **Broken Socket Reference in `VoiceService`**:
   - `VoiceService` was initialized as a singleton. In its constructor, it assigned:
     ```typescript
     this.socket = socketService.getSocket();
     ```
   - In `src/App.tsx`, `socketService.connect()` is called inside a `useEffect`. Because `socket.connected` was false initially, `connect()` disconnected the preliminary socket and created a brand new `io()` instance.
   - `VoiceService` remained permanently attached to the dead, orphaned socket instance. None of the incoming signaling events (`voice:signal`, `voice:participantJoined`, etc.) were ever received.

2. **Dropped Early ICE Candidates (Race Condition)**:
   - When Peer A created an offer, Peer B received ICE candidates almost simultaneously.
   - If an ICE candidate arrived before `peerConnection.setRemoteDescription()` had completed, `pc.addIceCandidate(candidate)` threw an `InvalidStateError`.
   - `VoiceService` caught this error and discarded the candidate without buffering, preventing NAT hole punching.

3. **Browser Audio Autoplay Restrictions**:
   - When remote audio tracks were attached to dynamic `<audio>` elements, browsers blocked autoplay due to missing user gesture context.
   - The `.play()` call failed silently with `NotAllowedError`. No user prompt ("Click to Unmute / Enable Audio") was provided to resolve the restriction.

4. **Premature Client State Activation**:
   - `voiceService.join(roomCode)` immediately marked `this.isActive = true` before the server validated room privacy or returned available ICE servers and participants.
   - If the server rejected the join, the client UI remained in a broken "connected" state.

---

## 3. Secondary Defects & Security Vulnerabilities

### 3.1 Unauthenticated Word Selection
In `server/index.ts`:
```typescript
socket.on('word:select', (data) => {
  const room = roomManager.getRoom(data.roomCode);
  if (room) {
    roomManager.selectWord(room, data.word);
  }
});
```
Any client knowing the room code could emit `word:select` with arbitrary text, overwriting the drawer's word choice.

### 3.2 Private Room Spectator Bypass
In `server/game/RoomManager.ts`, `joinAsSpectator` did not inspect `room.settings.isPrivate`. Any user could join private matches as a spectator and view secret words in the room state.
