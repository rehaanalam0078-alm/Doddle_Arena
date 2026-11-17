# Master Repair & Implementation Plan

## Phase 1: Shared Contracts & Type Definitions
1. In `shared/types.ts`:
   - Add `RoomLeavePayload`: `{ roomCode: string }`.
   - Add `RoomLeaveResponse`: `{ success: boolean; error?: string }`.
   - Add `VoiceJoinResponse`: `{ success: boolean; iceServers?: RTCIceServer[]; participants?: VoiceParticipant[]; error?: string }`.

## Phase 2: Room Lifecycle & Leaving a Game (Fix for Bug #1)
1. In `server/game/RoomManager.ts`:
   - Implement `leaveRoom(socket: Socket, roomCode?: string): { success: boolean; error?: string }`.
   - Remove socket from `room.socketToPlayerId`.
   - Remove player from `room.players`.
   - Call `socket.leave(room.code)`.
   - Handle host migration: assign host to next remaining player.
   - Handle drawer departure: if current drawer leaves during `WORD_SELECTION` or `DRAWING`, cancel active turn timers, broadcast notice, and advance to next turn.
   - Clean up empty rooms completely (clear intervals, remove from `rooms` map).
   - Broadcast updated room state and system notice to remaining players.
2. In `server/index.ts`:
   - Register `socket.on('room:leave', (data, callback) => { ... })`.
   - Call `roomManager.leaveRoom(socket, data?.roomCode)`.
   - Ensure `socket.on('disconnect')` cleans up all rooms and voice sessions.
3. In `src/services/socket.ts`:
   - Implement `leaveRoom(roomCode: string): Promise<boolean>`.
4. In `src/App.tsx`:
   - Add `activeRoomCodeRef`, `membershipStatus` (`IDLE` | `IN_ROOM` | `LEAVING`).
   - In `handleLeaveRoom`:
     - Set `membershipStatus = 'LEAVING'`.
     - Call `voiceService.leave()`.
     - Await `socketService.leaveRoom()`.
     - Reset `roomState` and navigate to `'lobby'`.
   - In `room:state` and drawing/chat event handlers:
     - Discard events if `membershipStatus !== 'IN_ROOM'` or if `state.code !== activeRoomCodeRef.current`.
   - In Navigation bar:
     - Add leave confirmation if player clicks global navigation while in an active game.

## Phase 3: Socket Connection Stability & Listener Management
1. In `src/services/socket.ts`:
   - Make `connect()` strictly idempotent without destroying active socket instances unless the target URL changes.
   - Add listener rebinding mechanism for attached services.
2. In `src/services/voice.ts`:
   - Bind signaling listeners dynamically to the active socket; update listeners if the socket reconnects.

## Phase 4: WebRTC Voice Communication Overhaul (Fix for Bug #2)
1. In `server/voice/VoiceManager.ts`:
   - Update `handleJoin` to validate:
     - Room exists.
     - `room.settings.isPrivate === true`.
     - `room.settings.voiceChatEnabled === true`.
     - Sender is an active player (not a spectator).
   - Return structured acknowledgement callback `{ success, iceServers, participants, error }`.
   - Implement clean `handleLeave(socket, roomCode)`.
2. In `src/services/voice.ts`:
   - Add cancellation token for `getUserMedia` prompt.
   - Only activate voice state after receiving positive server acknowledgement.
   - Implement ICE candidate buffering queue before `setRemoteDescription`.
   - Implement audio autoplay block detection (`NotAllowedError`) and expose `autoplayBlocked` state.
   - Add user recovery method `resumeAudioPlayback()`.
   - Guarantee track cleanup (`track.stop()`) on disconnect, mute, and room exit.
3. In `src/components/voice/VoiceChatBar.tsx`:
   - Show "Tap to Enable Audio" action banner when `autoplayBlocked` is true.

## Phase 5: Security, Access Control & Data Cleanup
1. In `server/index.ts`:
   - Authorize `word:select`: check socket is the room's current drawer, room is in `WORD_SELECTION`, and word matches one of `room.wordOptions`.
   - Authorize `spectator:join`: reject private rooms unless explicit authorization token exists.
2. In `server/db/Database.ts` & `server/game/CompetitiveService.ts`:
   - Remove fake player seeding in production mode.
   - Present honest matchmaking queue status.
   - Document JSON file storage accurately.
3. In `src/vite-env.d.ts`:
   - Add typed `ImportMetaEnv`.

## Phase 6: Automated Test Suite Implementation
- Create the 7 required regression test suites in `tests/`:
  1. `tests/RoomLeaveLifecycle.test.ts`
  2. `tests/RoomMembershipIsolation.test.ts`
  3. `tests/VoiceSocketLifecycle.test.ts`
  4. `tests/VoiceJoinAuthorization.test.ts`
  5. `tests/VoiceConnectionRecovery.test.ts`
  6. `tests/WebRTCAudioIntegration.test.ts`
  7. `tests/PrivateRoomSecurity.test.ts`
- Run all tests and verify 100% pass rate.
