# Room Lifecycle & Membership Isolation Audit

## 1. Overview of Room States and Transitions

The Doodle Arena room lifecycle progresses through the following phases:
```
[LOBBY] ──(game:start)──> [COUNTDOWN (3s)] ──> [WORD_SELECTION (15s)] ──(word:select)──> [DRAWING]
                                                                                            │
  ┌─────────────────────────────────────────────────────────────────────────────────────────┘
  ▼
[ROUND_RESULT (5s)] ──(more rounds)──> [WORD_SELECTION]
                    ──(final round)──> [MATCH_RESULT] ──(rematch:vote)──> [COUNTDOWN]
```

---

## 2. Room Departure Scenarios & Required Handling

### 2.1 Intentional Departure (`room:leave`)
1. **Host Departure**:
   - If the leaving player is the room host (`isHost: true`), host status must be migrated immediately to the oldest remaining connected player.
   - If no connected players remain, the room must be completely destroyed and timers canceled.
2. **Current Drawer Departure**:
   - If the drawer leaves during `WORD_SELECTION` or `DRAWING`, the active timer (`timerInterval`, `selectionTimeout`, bot timeouts) must be canceled.
   - Broadcast system alert: `"${drawer.name} left the room. Advancing to next turn."`
   - Advance `drawerIndex` and transition cleanly to the next turn or round.
3. **Guesser Departure**:
   - Remove guesser from `room.players`.
   - Re-check `allGuessed` condition: if all remaining guessers have guessed correctly, trigger `endRound` immediately.
4. **Channel Cleanup**:
   - Remove mapping `socketToPlayerId.delete(socket.id)`.
   - Call `socket.leave(room.code)`.
   - Invalidate active room reference on client.

### 2.2 Unintentional Disconnect (`disconnect`)
- Socket disconnect must invoke the same cleanup logic as `room:leave` to prevent zombie player records.
- If player reconnects within a grace period, re-associate socket ID with existing player ID.

---

## 3. Client-Side Session Isolation

To guarantee that departed players are never pulled back into a match:
1. `App.tsx` maintains:
   - `activeRoomCodeRef: React.MutableRefObject<string | null>`
   - `roomSessionIdRef: React.MutableRefObject<string | null>`
   - `membershipStatus: 'IDLE' | 'IN_ROOM' | 'LEAVING'`
2. When `handleLeaveRoom` is invoked:
   - Status switches to `'LEAVING'`.
   - `voiceService.leave()` is executed.
   - `socketService.leaveRoom(roomCode)` emits `room:leave` to backend.
   - `activeRoomCodeRef.current = null`.
   - `roomState` is reset to `null`.
   - `currentView` switches to `'lobby'`.
3. In all incoming socket event listeners (`room:state`, `drawing:stroke`, `chat:message`, `word:options`):
   - Events are discarded if `membershipStatus !== 'IN_ROOM'` or if `event.roomCode !== activeRoomCodeRef.current`.
