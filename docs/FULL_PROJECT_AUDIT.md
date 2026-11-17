# Full Project Audit: Doodle Arena

## 1. Executive Summary & Architecture Overview

Doodle Arena is a real-time multiplayer drawing and guessing game built with a modern TypeScript stack:
- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide icons, Canvas Confetti.
- **Backend**: Node.js, Express 4, Socket.IO 4.
- **Persistence**: File-backed JSON repository (`data/doodle_arena.json`) for players, match records, and artwork; indexed word repository (`data/drawable_word_bank_v2(1).json` with 2,746 records).
- **Real-Time Communication**: Socket.IO for game orchestration, canvas stroke synchronization, and chat; WebRTC mesh for peer-to-peer voice communication in private rooms.
- **Deployment**: Frontend hosted on GitHub Pages (`https://rehaanalam0078-alm.github.io/Doddle_Arena/`); Backend hosted on Render (`https://doddle-arena.onrender.com`).

---

## 2. Component Inventory & Responsibility Map

### 2.1 Frontend Components (`src/components/`)
| Component | Responsibility | Current State / Defect Surface |
| :--- | :--- | :--- |
| `App.tsx` | Master view router and top-level Socket.IO listener coordinator | Re-renders into game views on incoming `room:state` events even after user exits to lobby. Lacks active room validation. |
| `Canvas.tsx` | HTML5 canvas for drawing, brush size/color, tool selection, undo/redo/clear | Renders strokes accurately; properly receives broadcast events. Requires complete clear on turn transitions. |
| `ChatBox.tsx` | Chat display, guess submission, celebration cards, system notifications | Accurately distinguishes normal chat from close/correct guesses. |
| `VoiceChatBar.tsx` | Voice room controls: mute, participants list, speaking indicators, connection state | Prematurely displays active state; lacks user action prompt for browser autoplay restrictions. |
| `Navigation.tsx` | Header bar with active view switcher, status pills, and settings modal trigger | Clicking navigation during active game allows exit without sending leave signal to server. |
| `LobbyView.tsx` | Room browser, private room creation modal, join with room code | Creates/joins rooms cleanly. |
| `DrawerGameView.tsx` | Active drawer interface, word selection modal, canvas controls | Displays word choices; sends `word:select` and drawing strokes. |
| `GuesserGameView.tsx` | Guesser interface, canvas viewing, clue display, chat guessing | Displays canvas strokes and guess input. |
| `MatchResultView.tsx` | Match podium, score ranking, artwork gallery, rematch voting | Rematch button triggers rematch vote. |
| `RankedQueueView.tsx` | Competitive ranked matchmaking queue interface | Previously displayed fake instant countdown and demo opponent battles. |

### 2.2 Client Services (`src/services/`)
| Service | Responsibility | Current State / Defect Surface |
| :--- | :--- | :--- |
| `socket.ts` | Singleton managing Socket.IO connection and client emitters | Replaces socket instance on `connect()`, invalidating references in `voice.ts`. Lacks `leaveRoom` emitter. |
| `voice.ts` | WebRTC peer connection manager (mesh topology), microphone input, signaling | Stores stale socket reference from constructor; lacks ICE candidate queue before `remoteDescription`; lacks autoplay error recovery. |

### 2.3 Backend Modules (`server/`)
| Module | Responsibility | Current State / Defect Surface |
| :--- | :--- | :--- |
| `server/index.ts` | Express HTTP server, REST endpoints, Socket.IO event router | Missing `room:leave` handler. Unauthenticated `word:select` handler allows any socket to choose word. |
| `server/game/RoomManager.ts` | Room state machine, turn timers, player membership, scoring | Missing `leaveRoom` method. Sockets remain joined to Socket.IO room upon leaving. Turn timers not bound to socket disconnect. |
| `server/voice/VoiceManager.ts` | Voice room signaling, participant tracking, ICE server relay | Does not acknowledge `voice:join`. Does not validate private-room settings or spectator exclusions. |
| `server/db/Database.ts` | JSON database persistence for players, matches, artworks | Seeding demo players in production causes deceptive leaderboard state. |
| `server/db/WordRepository.ts` | 2,746-word dataset indexer, category search, difficulty filtering | Validated and fully operational. |

---

## 3. High-Priority Defects Identified

1. **Defect 1 (Critical): Room Exit Failure / Ghost Re-entry**
   - User clicking "Leave Room" or navigating away clears local React state but never instructs the backend to remove the player.
   - The socket remains in the Socket.IO room channel and `room.socketToPlayerId`.
   - Subsequent `room:state` broadcasts from turns or countdowns force the frontend back into the drawer or guesser view.

2. **Defect 2 (Critical): WebRTC Voice Communication Failure / Silent Audio**
   - Disconnected socket reference inside `VoiceService` due to client-side socket recreation.
   - Dropped ICE candidates received prior to remote SDP offer negotiation (`InvalidStateError`).
   - Browser autoplay policy prevents `<audio>` elements from playing audio without explicit user interaction gesture.
   - Lack of server-side acknowledgement before activating voice UI.

3. **Defect 3 (Security): Word Selection Authorization Gap**
   - `word:select` event in `server/index.ts` permits any connected socket to choose the secret word, even if they are not the designated drawer or not in the room.

4. **Defect 4 (Security): Spectator Private Room Bypass**
   - Spectators can join private matches via `spectator:join` without room host permission or secret code verification.

5. **Defect 5 (Integrity): Artificial Seed Players & Matchmaking**
   - Demo players (`DoodleQueen`, `NeonSketcher`, etc.) artificially injected into database in production.
   - Ranked matchmaking presents simulated opponent timers rather than genuine queue pooling.
