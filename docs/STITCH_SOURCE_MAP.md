# Stitch Source Map — Doodle Arena

**Project Resource:** `projects/16271601477356813138`  
**Project Title:** `Doodle Arena UI/UX Design System`  
**Extracted Date:** 2026-11-16  
**Source of Truth:** Stitch MCP Discovery API & Design Tokens  

---

## Screen Inventory & Source Artifacts

| Screen # | Screen Title | Stitch Resource Name | Dimensions | Reference File |
| :--- | :--- | :--- | :--- | :--- |
| **SCREEN 01** | **Homepage & Main Lobby** | `projects/16271601477356813138/screens/4f5e6c6adcaf4baea9772dc0726a4d5c` | 2560 × 4474 (Desktop) | `stitch_reference/doodle_arena_homepage_main_lobby.html` |
| **SCREEN 02** | **Multiplayer Room Lobby** | `projects/16271601477356813138/screens/8af5ec8edc004484947d4cf22a21de67` | 2560 × 2226 (Desktop) | `stitch_reference/doodle_arena_multiplayer_room_lobby.html` |
| **SCREEN 03** | **Gameplay: Drawer View** | `projects/16271601477356813138/screens/6aa0777bfca7455db2ccfdbf74ae8bd5` | 2560 × 2048 (Desktop) | `stitch_reference/doodle_arena_gameplay_drawer_view.html` |
| **SCREEN 04** | **Gameplay: Guesser View & Word Select** | `projects/16271601477356813138/screens/6a2ef28ec96f4c3194f6237daf3f063f` | 2560 × 3174 (Desktop) | `stitch_reference/doodle_arena_gameplay_guesser_view_word_select.html` |
| **SCREEN 05** | **Final Scoreboard & Podium Celebration** | `projects/16271601477356813138/screens/52053e59e0ca4c5387e4eecc8543c2df` | 2560 × 3884 (Desktop) | `stitch_reference/doodle_arena_final_scoreboard_podium_celebration.html` |
| **SCREEN 06** | **Competitive Arena & Ranked Hub** | `projects/16271601477356813138/screens/5bd914e5863f4a83bb0cea75d7fe845a` | 2560 × 3504 (Desktop) | `stitch_reference/doodle_arena_competitive_arena_ranked_hub.html` |
| **SCREEN 07** | **Tournament Bracket & Match Schedule** | `projects/16271601477356813138/screens/3afcda7fcbf94948a0588c870e0af846` | 2560 × 3288 (Desktop) | `stitch_reference/doodle_arena_tournament_bracket_match_schedule.html` |
| **SCREEN 08** | **Spectator Live View & Stream** | `projects/16271601477356813138/screens/36070984b7e94c659fb6480a4dd95b8f` | 2560 × 2518 (Desktop) | `stitch_reference/doodle_arena_spectator_live_view_stream.html` |

---

## Design System Specification File
- **Source:** `doodle_arena/DESIGN.md` (retrieved via Stitch MCP project payload `designMd`)
- **Local Cache:** `stitch_reference/DESIGN.md`

---

## Layout Dimensions & Component Hierarchy

1. **Top Application Bar**: Fixed sticky header (height 68px–72px), containing Brand logo with live player counter pill, central tabbed routes (`Lobby`, `Leaderboard`, `Rooms`, `Shop`), right utility triggers (`Audio`, `Language`, `Help`), and user XP/Level avatar preview.
2. **Three-Column Gameplay Arena (Screens 03, 04, 08)**:
   - **Left Column (240px–280px)**: Live player roster, scores, badges (Host, Drawer pencil, Guessed checkmark, Ranking podium 1-3).
   - **Center Column (Fluid, 4:3 / 16:10 Canvas)**: Drawing workspace, upper word hint banner (`_ O _ D _ E` or revealed drawer secret word), circular progress countdown timer, and bottom docked tactile tool belt.
   - **Right Column (320px–360px)**: Real-time guess/chat feed with color-coded alerts (Normal slate, Close amber pill, Correct turquoise celebration card) and tactile guess input field.
3. **Hero & Dashboard Grids (Screens 01, 02, 05, 06, 07)**:
   - 12-column responsive grid layout with 24px–32px gutters and 24px–32px card padding.
   - Tactile 3D button interactions with physical bevels (`border-bottom: 4px solid ...`) and active depression states (`translate-y: 2px`).
