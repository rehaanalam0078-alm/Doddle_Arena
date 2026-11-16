# Doodle Arena: Private Room Voice Communication

## 1. Feature Directive Overview

To provide an engaging party experience for friends while upholding strict privacy and trust standards for casual and competitive matchmaking, real-time voice communication is implemented **strictly and exclusively inside private rooms**.

Voice communication is:
- **Strictly Prohibited in Public Rooms & Ranked Queues:** Public matchmaking rooms never expose voice chat controls and immediately reject any unauthorized signaling requests.
- **Opt-in per Room:** Private room hosts must explicitly toggle `voiceChatEnabled` ON (defaults to OFF).
- **Opt-in per Player:** Even in rooms with voice enabled, players must explicitly click "Join Voice" and grant microphone browser permissions.

---

## 2. Host Configuration & Room Lifecycle

### A. Private Room Creation Modal
During room creation (`src/components/modals/CreateRoomModal.tsx`), the host is presented with the tactile Voice Chat toggle:
- **Toggle:** `[ OFF / ON ]` (default OFF)
- **Description:** *"Enable voice communication so players in this private room can talk to one another during the game."*

### B. Lobby Match Settings
In `RoomLobbyView.tsx`, the host can toggle Voice Chat live from the Match Settings panel. If the host disables voice chat while a session is active, the server automatically terminates all active WebRTC sessions and emits `voice:terminated` to all participants.

---

## 3. Component Architecture: `VoiceChatBar.tsx`

The `VoiceChatBar` component (`src/components/voice/VoiceChatBar.tsx`) serves as the player's tactile audio station across the game lifecycle:

1. **Mounting Points:**
   - **Lobby View (`RoomLobbyView.tsx`):** Positioned between room header and doodler grid.
   - **Drawer View (`DrawerView.tsx`):** Mounted below top gameplay HUD.
   - **Guesser View (`GuesserView.tsx`):** Mounted below clue header.
2. **Conditional Rendering Guard:**
   ```tsx
   if (!room.settings.isPrivate || !room.settings.voiceChatEnabled) {
     return null;
   }
   ```
   If either condition is false, the component unmounts and renders nothing.
3. **Player Controls:**
   - **Join Voice / Disconnect:** One-click connection using modern WebRTC.
   - **Mute / Unmute:** Hardware-level audio track disable and software mute indicator broadcast.
   - **Live Speaking Indicators:** Visual pulsing green aura around avatars when speaking, detected via Web Audio API frequency analysis.
   - **Error Banner:** Friendly alert for denied microphone permissions or hardware errors.

---

## 4. Teardown & Resource Cleanup

Microphone streams, WebRTC peer connections, and audio elements are systematically cleaned up:
- When a user clicks **Disconnect** in `VoiceChatBar`.
- When a user leaves the room or clicks **Leave** (`voiceService.leave()`).
- When the host toggles voice chat to **OFF** in room settings.
- When a player closes their browser tab or disconnects from the Socket.IO server.
