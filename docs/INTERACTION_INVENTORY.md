# Interaction Inventory — Doodle Arena

Per Master Implementation Directive (Part 12 & Part 19): Every visible interactive element must be tracked with its expected behavior, implemented behavior, API/event dependency, and test status.

---

## Screen 01: Homepage & Main Lobby

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Top Nav** | Lobby | Stay on / navigate to Lobby | Navigates to view `lobby` | Local Router State | Verified |
| **Top Nav** | Leaderboard | Open global leaderboard | Navigates to view `leaderboard` | REST `/api/leaderboard` | Verified |
| **Top Nav** | Rooms | Open public rooms directory | Navigates to view `rooms` | REST `/api/rooms/public` | Verified |
| **Top Nav** | Shop | Open cosmetics shop | Navigates to view `shop` | REST `/api/shop/items` | Verified |
| **Top Nav** | Sound Toggle | Toggle SFX/Music mute | Toggles sound mute state + icon | `SoundService` | Verified |
| **Top Nav** | Language Selector | Change language (EN/ES/FR) | Toggles active language dropdown | `i18n` state | Verified |
| **Top Nav** | Help / Tutorial | Open game guide modal | Opens `RulesHelpModal` | UI Modal State | Verified |
| **Top Nav** | Avatar Profile | Open player profile & stats | Opens `ProfileModal` | Player State Store | Verified |
| **Avatar Lab**| Surprise Me | Randomize avatar & nickname | Generates random avatar parts & tag | Local generator | Verified |
| **Avatar Lab**| Previous / Next Hat | Cycle cosmetic hats | Updates avatar preview & store | Local generator | Verified |
| **Avatar Lab**| Color Swatches | Pick avatar base color | Updates active color halo | Local generator | Verified |
| **Avatar Lab**| Nickname Input | Enter custom player name | Validates 2-16 chars, family-friendly | Local validate | Verified |
| **Avatar Lab**| Roll Nickname | Generate funny random name | Replaces tag with random doodler name | Local generator | Verified |
| **Room Join** | Code Input | Enter private room code | Formats uppercase `#ROAR-xxx` | Local format | Verified |
| **Room Join** | Paste Button | Paste from clipboard | Reads clipboard text with fallback | Clipboard API | Verified |
| **Room Join** | Join Button | Join private room | Emits `room:join` to server | Socket `room:join` | Verified |
| **Launch Deck**| Play Casual | Instant match / lobby creation | Creates/joins public casual room | Socket `room:create` | Verified |
| **Launch Deck**| Competitive Arena | Enter ranked queue hub | Navigates to view `competitive` | Router state | Verified |
| **Launch Deck**| Create Private Room| Open custom room configurator | Opens `CreateRoomModal` | Modal state | Verified |
| **Launch Deck**| Featured Ticker | Jump into featured public lobby | Joins featured room as spectator/player | Socket `room:join` | Verified |
| **Game Modes** | Classic / Speed / Word Fiesta / Team Duel | Launch selected mode | Opens room setup configured for mode | Modal state | Verified |

---

## Screen 02: Multiplayer Room Lobby

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Header** | Leave Game | Leave room and return to lobby | Confirms and emits `room:leave` | Socket `room:leave` | Verified |
| **Room Mgmt**| Copy Code | Copy room code to clipboard | Copies code + shows toast confirmation | Clipboard API | Verified |
| **Room Mgmt**| Share Link | Generate copyable invite URL | Opens `InviteModal` with full URL | Share / Clipboard | Verified |
| **Settings** | Rounds (- / +) | Change round count (2-10) | Emits updated room settings (Host only) | Socket `room:settingsUpdate` | Verified |
| **Settings** | Draw Time | Toggle 60s, 80s, 100s, 120s | Emits updated round clock (Host only) | Socket `room:settingsUpdate` | Verified |
| **Settings** | Difficulty | Select Easy, Medium, Hard | Emits updated difficulty (Host only) | Socket `room:settingsUpdate` | Verified |
| **Settings** | Edit Pack | Open custom wordpack editor | Opens `WordlistEditorView` | Router state | Verified |
| **Lobby Chat**| Chat Input & Send | Send message to lobby | Emits chat message with rate-limiting | Socket `chat:message` | Verified |
| **Lobby Chat**| Quick Reactions | Send emoji reaction pills | Broadcasts quick floating reaction | Socket `chat:reaction` | Verified |
| **Footer** | Ready Status Button| Toggle Ready / Not Ready | Emits player ready status toggle | Socket `player:ready` | Verified |
| **Footer** | Start Game Button | Start multiplayer countdown | Validates min 2 players, emits start | Socket `game:start` | Verified |

---

## Screen 03: Gameplay: Drawer View

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canvas** | Freehand Draw | Paint strokes on canvas | Normalized pointer stream to canvas & socket | Socket `drawing:stroke` | Verified |
| **Canvas** | Eraser Tool | Erase drawn pixels | Strokes drawn in background erase color | Socket `drawing:stroke` | Verified |
| **Canvas** | Fill Bucket | Flood fill closed regions | Canvas flood fill algorithm | Socket `drawing:stroke` | Verified |
| **Canvas** | Shapes (Line, Rect, Circle) | Draw geometric shapes | Shape preview and commit | Socket `drawing:stroke` | Verified |
| **Canvas** | Brush Sizes | Select 4px, 8px, 16px, 32px | Sets brush diameter preview | Canvas state | Verified |
| **Canvas** | Color Palette | Select palette color swatches | Sets stroke color with halo ring | Canvas state | Verified |
| **Canvas** | Color Picker | Custom hex/RGB color | HTML color input trigger | Canvas state | Verified |
| **Canvas** | Undo Button | Remove last drawn stroke | Reverts stroke history on server & room | Socket `drawing:undo` | Verified |
| **Canvas** | Redo Button | Restore undone stroke | Restores stroke history on server & room | Socket `drawing:redo` | Verified |
| **Canvas** | Clear Canvas | Clear entire drawing | Shows confirmation dialog, then clears | Socket `drawing:clear` | Verified |
| **Right Bar** | Locked Chat | Explains drawer cannot guess | Shows banner: "You are the Drawer!" | UI State | Verified |

---

## Screen 04: Gameplay: Guesser View & Word Select

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Word Select**| 3 Word Cards | Select 1 of 3 tiered mystery words | Drawer picks card; confirms choice | Socket `word:select` | Verified |
| **Word Select**| Confirm Button | Lock in selected secret word | Emits choice to server, starts timer | Socket `word:select` | Verified |
| **Canvas** | Mirrored Drawing | Renders drawer strokes live | Subscribes to real-time stroke stream | Socket `drawing:stroke` | Verified |
| **Canvas** | Zoom Controls | Zoom in / Zoom fit canvas | Toggles scale transform on canvas wrapper| UI State | Verified |
| **Canvas** | Like Artwork | Send thumbs up / heart reaction | Increments drawing likes on server | Socket `drawing:like` | Verified |
| **Guess Input**| Text Field | Type secret word guess | Enter key or submit button triggers guess | Socket `guess:submit` | Verified |
| **Guess Stream**| Guess Feedback | Show normal, close, or correct | Renders color-coded cards and score alerts| Socket `guess:correct` | Verified |

---

## Screen 05: Final Scoreboard & Podium Celebration

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Podium** | Top 3 Badges | Displays 1st (Gold), 2nd, 3rd | Renders animated victory podium with avatars| Match results | Verified |
| **Gallery** | Artwork Carousel | Browse round drawings | Step through saved round vector drawings | Local artworks | Verified |
| **Gallery** | Download Artwork | Save drawing image | Exports canvas snapshot as PNG image | Browser download | Verified |
| **Actions** | Vote Rematch | Vote for another game | Emits vote, auto-restarts when majority | Socket `rematch:vote` | Verified |
| **Actions** | Return to Lobby | Exit match to lobby | Leaves match state, returns to lobby | Router state | Verified |
| **Actions** | Share Results | Copy match recap summary | Copies match stats to clipboard | Clipboard API | Verified |

---

## Screen 06: Competitive Arena & Ranked Hub

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Matchmaking**| Find Ranked Match| Enqueue into ranked matchmaking | Displays matchmaking queue ticker | Socket `ranked:queue` | Verified |
| **Matchmaking**| Cancel Queue | Leave matchmaking queue | Cancels search, restores lobby state | Socket `ranked:cancel` | Verified |
| **Filters** | Global / Regional / Friends | Filter ranked leaderboard | Fetches filtered leaderboard records | REST `/api/ranked/board` | Verified |
| **Battle Log** | Match Replay | View step-by-step canvas replay | Opens `MatchReplayModal` with slider | Local replay store | Verified |
| **Guidelines**| Anti-Cheat & Rules| Open competitive guidelines | Opens rule dialog | Modal state | Verified |

---

## Screen 07: Tournament Bracket & Match Schedule

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Filters** | Bracket Stage Filter| Filter R16, QF, Semis, Finals | Switches active visual bracket stage | UI state | Verified |
| **Bracket** | Spectate Match | Spectate selected tournament match | Joins match room as spectator | Socket `spectator:join` | Verified |
| **Schedule** | Match Rows | View live scores and player tags | Displays real-time match statuses | Tournament service | Verified |
| **Feed** | Tournament Chat | Send message to tournament feed | Broadcasts tournament live chatter | Socket `tournament:chat` | Verified |
| **CTA** | Register Next Cup | Register for upcoming cup | Opens `TournamentRegisterModal` | Modal state | Verified |

---

## Screen 08: Spectator Live View & Stream

| Component | Control / Button | Expected Behavior | Implemented Behavior | Dependency / Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stream HUD** | Spoiler Visibility| Toggle Secret Word reveal | Unmasks/masks secret word for viewer | Spectator state | Verified |
| **Stream HUD** | Theater Mode | Expand canvas to full viewport | Toggles full-bleed theater mode (Key 'T') | UI state | Verified |
| **Stream HUD** | Grid Overlay | Display alignment grid | Toggles 20px grid on canvas | UI state | Verified |
| **Stream Chat**| Spectator Chat | Send message in spectator tab | Broadcasts with spectator badge | Socket `spectator:chat` | Verified |
| **Reactions** | Cheer Emojis | Fire, Clap, Masterpiece, Mindblown| Triggers floating burst animations (Key 'C')| Socket `spectator:burst` | Verified |
| **Shortcuts** | T, C, M, S | Execute theater, cheer, mute, spoiler | Keyboard event listeners trigger actions | Event listeners | Verified |
