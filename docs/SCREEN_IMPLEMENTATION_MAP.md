# Screen Implementation Map — Doodle Arena

This document maps all 8 primary Stitch designs and auxiliary modal screens to their React components, state requirements, and server dependencies.

---

## Screen & Component Architecture

| Screen Identifier | Stitch Design File | React Component | Primary Features & Child Components |
| :--- | :--- | :--- | :--- |
| **SCREEN 01: Homepage & Main Lobby** | `doodle_arena_homepage_main_lobby.html` | `src/views/MainLobbyView.tsx` | - Top Navigation Bar (`AppHeader.tsx`)<br>- Doodler Persona Studio (`AvatarCustomizer.tsx`)<br>- Nickname Input & Randomizer (`NicknameField.tsx`)<br>- Room Code Fast Pass (`RoomCodeInput.tsx`)<br>- Mode Launch Deck (Casual, Ranked, Create Room)<br>- Featured Game Modes Bento Grid (`GameModeGrid.tsx`)<br>- How It Works (3 Steps)<br>- Weekly Top Doodlers (`LeaderboardPreview.tsx`)<br>- Word of the Day & Community Ticker |
| **SCREEN 02: Multiplayer Room Lobby** | `doodle_arena_multiplayer_room_lobby.html` | `src/views/RoomLobbyView.tsx` | - Room Header (`#ROAR-409`, Audio, Leave Room)<br>- Room Code Copy / Share Link Modal<br>- Player Roster Grid (Avatars, Ready status, Host crown)<br>- Host Room Settings Panel (Rounds, Clocks, Difficulty, Word Pack)<br>- Real-time Lobby Chat & Quick Reactions<br>- Bottom Controls (Invite Friends, Ready Up, Start Game) |
| **SCREEN 03: Gameplay: Drawer View** | `doodle_arena_gameplay_drawer_view.html` | `src/views/DrawerView.tsx` | - Top Drawer HUD (Secret Word, Category, Round, Autorotating Timer)<br>- Left Player Leaderboard (Scores, Badges, Drawing Ring)<br>- Interactive Drawing Canvas (`DrawingCanvas.tsx`)<br>- Docked Tactile Toolbelt (`DrawingToolbar.tsx`)<br>- Brush, Eraser, Fill Bucket, Shapes, Sizes (4/8/16/32px)<br>- Color Swatches & Eyedropper (`ColorPalette.tsx`)<br>- Undo / Redo / Clear Canvas Confirmation<br>- Right Chat & Live Guess Stream (Locked guess input with drawer explainer) |
| **SCREEN 04: Gameplay: Guesser View & Word Select** | `doodle_arena_gameplay_guesser_view_word_select.html` | `src/views/GuesserView.tsx` | - Top Word Clue Banner (`_ O _ D _ E`, category, timer, bonus multiplier)<br>- Left Player Scoreboard<br>- Live Mirrored Drawing Canvas (Real-time stroke sync)<br>- Center Word Selection Modal (`WordSelectionModal.tsx`) (3 Tiered cards: Easy/Med/Hard with points)<br>- Guess Input Field (Enter to submit, case-insensitive, close-guess amber alert)<br>- Right Guess Stream (Celebratory turquoise card on correct solve)<br>- Like Drawing & Canvas Zoom Controls |
| **SCREEN 05: Final Scoreboard & Podium Celebration** | `doodle_arena_final_scoreboard_podium_celebration.html` | `src/views/ScoreboardView.tsx` | - 1st, 2nd, 3rd Position Animated Victory Podium<br>- Complete Ranked Player Leaderboard with XP & Accuracies<br>- Match MVP & Highlights (Fastest Guess, Masterpiece Art)<br>- Match Art Gallery Carousel & Artwork Download<br>- Rematch Voting Engine (`rematch:vote`) with live vote tallies<br>- Return to Lobby & Share Results CTA |
| **SCREEN 06: Competitive Arena & Ranked Hub** | `doodle_arena_competitive_arena_ranked_hub.html` | `src/views/CompetitiveArenaView.tsx` | - Player Competitive Tier Card (Gold II, ELO, Win Rate, Streak)<br>- Matchmaking Queue Deck (Casual vs Ranked, 1v1 Duel, 8-Player FFA)<br>- Ranked Queue State (`Finding Match...`, Cancel Queue, Match Found dialog)<br>- Competitive Leaderboard (Global Top 100, Regional, Friends)<br>- Recent Battle Match History & ELO Delta Log<br>- Anti-Cheat & Tournament Guidelines Modal |
| **SCREEN 07: Tournament Bracket & Match Schedule** | `doodle_arena_tournament_bracket_match_schedule.html` | `src/views/TournamentView.tsx` | - Tournament Info Banner (Summer Masters Cup, Live Status, Prize Pool)<br>- Interactive Visual Bracket (Round of 16, Quarterfinals, Semis, Finals)<br>- Bracket Filter Buttons & Pan/Zoom Controls<br>- Match Schedule (Live, Upcoming, Completed matches)<br>- Real-time Tournament Feed & Bracket Spectate Action<br>- Tournament Registration Modal (`TournamentRegisterModal.tsx`) |
| **SCREEN 08: Spectator Live View & Stream** | `doodle_arena_spectator_live_view_stream.html` | `src/views/SpectatorView.tsx` | - Live Canvas Synchronization with snapshot catch-up<br>- Spectator HUD (Matchup, Drawer, Round, Autorotating Timer)<br>- Spoiler Masking Toggle (Hide/Show Secret Word for viewers)<br>- Spectator Chat with Special Reaction Emojis (Fire, Masterpiece, Clap)<br>- Theater Mode & Grid Toggle (Keyboard shortcuts: T, C, M, S)<br>- Live Match Intel Feed & Prediction Poll |

---

## Auxiliary Modals & Secondary Pages (Part 11)

| Feature | Trigger Location | Component | Behavior |
| :--- | :--- | :--- | :--- |
| **Create Private Room** | Main Lobby / Mode Grid | `src/components/modals/CreateRoomModal.tsx` | Custom rounds (2-10), draw timer (60/80/100/120s), max players (2-16), wordlist pack picker |
| **Invite Friends Modal** | Room Lobby / Share CTA | `src/components/modals/InviteModal.tsx` | Copyable room link + direct room code + QR/Share web API fallback |
| **Custom Wordlist Editor**| Room Settings / Community | `src/views/WordlistEditorView.tsx` | Create, test, validate, and export custom JSON word packs with custom categories and difficulty tags |
| **Player Profile & Stats** | Top Header Avatar | `src/components/modals/ProfileModal.tsx` | XP, Level, unlocked cosmetics, game history, favorite tools |
| **Game Settings Modal** | Header Gear Icon | `src/components/modals/SettingsModal.tsx` | Audio volume (Master, SFX, Music), dark/light theme toggle, high-contrast canvas mode, hint sounds |
| **Game Rules & Tutorial** | Header Help Icon | `src/components/modals/RulesHelpModal.tsx` | Interactive 4-step interactive game guide, drawing etiquette, hotkeys cheat sheet |
| **Full Leaderboard View** | Top Nav / Lobby CTA | `src/views/LeaderboardView.tsx` | Global 100 rankings, filter by Weekly / All-Time / Friends, search by player tag |
| **Public Rooms Directory**| Top Nav Rooms Link | `src/views/RoomsDirectoryView.tsx` | Live list of active public lobbies with player counts, languages, round progress, and instant join |
| **Shop & Cosmetics** | Top Nav Shop Link | `src/views/ShopView.tsx` | Unlockable avatar hats, glasses, brushes, particle effects using earned in-game XP/coins |
| **Match Replay Viewer** | Competitive Hub / Battle Log | `src/components/modals/MatchReplayModal.tsx` | Step-by-step canvas stroke scrubbing with speed slider (1x, 2x, 4x) |
