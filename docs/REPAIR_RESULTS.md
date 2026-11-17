# System Repair Results: Doodle Arena

## 1. Summary of Repairs Completed

All identified architectural and runtime defects have been addressed systematically and verified with automated regression tests:

### 1.1 Bug #1: Room Exit & Membership Isolation
- **Problem**: Leaving a game cleared local React state without removing the socket from the backend room channel or player registry, causing subsequent turn or round transitions to re-open the match screen.
- **Root Cause**: `handleLeaveRoom` in `src/App.tsx` lacked a `socket.emit('room:leave')` call; the backend lacked a `room:leave` handler; and incoming `room:state` events in `App.tsx` were processed unconditionally.
- **Fix**:
  1. Added `leaveRoom(socket, roomCode)` to `server/game/RoomManager.ts`:
     - Explicitly deletes the player from `room.players` and `room.socketToPlayerId`.
     - Calls `socket.leave(room.code)`.
     - Handles host transfer if the departing player was host.
     - Advances turn or triggers round transition cleanly if the departing player was the current drawer.
     - Deletes the room if all active players have departed.
  2. Registered `socket.on('room:leave', ...)` with callback acknowledgement in `server/index.ts`.
  3. Added `leaveRoom(roomCode)` in `src/services/socket.ts`.
  4. In `src/App.tsx`, introduced `activeRoomCodeRef` and `membershipStatusRef` (`'IDLE' | 'IN_ROOM' | 'LEAVING'`). `handleLeaveRoom` sets status to `'LEAVING'`, halts voice, emits `leaveRoom`, resets local state, and routes to lobby.
  5. In all event listeners (`room:state`, `drawing:*`, `word:options`, `chat:message`), events are discarded if `membershipStatusRef.current !== 'IN_ROOM'` or if `state.code !== activeRoomCodeRef.current`.
  6. Added navigation guard when moving away from active gameplay views.

### 1.2 Bug #2: WebRTC Voice Communication Silence & Stability
- **Problem**: Voice chat failed to transmit audio reliably in private rooms.
- **Root Cause**:
  1. `VoiceService` attached listeners to a stale socket created before `socketService.connect()`.
  2. Incoming ICE candidates received before `remoteDescription` was set threw `InvalidStateError` and were permanently lost.
  3. Browser autoplay policies blocked incoming `<audio>` playback without user recovery.
  4. Client assumed connected state before server authorization.
- **Fix**:
  1. Added `subscribeSocketInstance` in `src/services/socket.ts` and dynamic rebinding `rebindSocketListeners(socket)` in `src/services/voice.ts`.
  2. Implemented ICE candidate buffering queue in `VoiceService`: early candidates are queued in `pendingCandidates` and flushed immediately upon `setRemoteDescription`.
  3. Implemented collision avoidance (polite peer rollback) to handle simultaneous offers.
  4. Handled browser `NotAllowedError` during `.play()`: exposed `state.autoplayBlocked` and added a "Tap to Enable Audio" action banner in `VoiceChatBar.tsx`.
  5. Added cancellation token in `VoiceService.join()`: if user leaves while microphone permission is pending, acquired media tracks are immediately stopped.
  6. `VoiceManager.handleJoin()` on the backend now returns structured response `{ success, iceServers, participants, error }` with callback acknowledgement.

### 1.3 Security, Authorization & Access Control
- **Word Selection Authorization**: In `server/index.ts` and `server/game/RoomManager.ts`, `selectWord` now verifies that the requesting socket matches `room.currentDrawerId`, that the room is in `WORD_SELECTION` phase, and that the word belongs to `room.wordOptions`.
- **Private Room Spectator Protection**: In `server/game/RoomManager.ts`, `joinAsSpectator` rejects spectator access to private rooms.
- **Audience Interactions**: `handleSpectatorReaction` and `handleArtworkLike` verify room membership before processing.
- **Single-Room Membership**: `leaveAllRooms(socket)` is executed before joining or creating any new room.

### 1.4 Production Data Integrity & Competitive Matchmaking
- **Demo Data Gating**: Gated `seedDefaultsIfEmpty` in `server/db/Database.ts` so mock profiles are not seeded into production data.
- **Matchmaking Transparency**: Replaced the fake 2-second timer with a genuine matching queue via `CompetitiveService.checkMatch()`.
- **Database Documentation**: Added clear architecture notice documenting JSON file storage.

### 1.5 Frontend Environment Typings
- Created `src/vite-env.d.ts` declaring `ImportMetaEnv` for `VITE_BACKEND_URL`, resolving TypeScript compiler warnings in `npm run lint`.
