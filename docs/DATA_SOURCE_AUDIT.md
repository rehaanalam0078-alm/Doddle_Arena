# Doodle Arena — Data Source Audit (Phases 0–4)
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** Software Architecture & Data Systems Team  
**Scope:** Data Flow Traceability, Persistence Layer, REST Endpoints, Client Session Initializers, Truthful Data Guarantees

---

## 1. Executive Summary

This document performs an exhaustive trace of every statistic, numeric display, player attribute, matchmaking measurement, and leaderboard entry currently rendered across Doodle Arena.

The audit identifies the precise file, line number, data structure, and generation mechanism for every value, and defines the authoritative, truthful implementation required for production data integrity.

---

## 2. Comprehensive Metric Trace Matrix

| Metric Name | Displayed Value | Origin Location | Mechanism | Data Truth Status | Required Authoritative Source |
|---|---|---|---|---|---|
| **Online Artists Count** | `14,820 ARTISTS ONLINE` | `server/index.ts:40`, `AppHeader.tsx:22` | Hardcoded arithmetic: `14820 + Math.floor(Math.random() * 50)` and default prop `14820` | **FABRICATED** | Calculate strictly from active Socket.IO connection pool: `io.sockets.sockets.size`. |
| **Matchmaking Queue Time** | `Avg. queue: 1.8s` | `MainLobbyView.tsx:277` | Hardcoded static JSX text | **FABRICATED** | Calculate dynamically from completed queue wait times over the last 10 matches; if `< 3` data points, display `"Instant"` or `"Queue Ready"`. |
| **Guest Player Identity** | `SpeedyPencil_99` | `src/App.tsx:40`, `RoomManager.ts:89`, `Database.ts:144` | Fallback default string `'SpeedyPencil_99'` | **FICTITIOUS DEFAULT** | Fresh guest sessions must generate unique anonymous guest identity: `Guest_${Math.floor(1000 + Math.random() * 9000)}`. |
| **Guest Starting Level** | `Level 24` | `src/App.tsx:49` | Hardcoded initial state `useState(24)` | **FABRICATED** | Fresh guests start at `Level 1`. Progression occurs solely through verified match XP. |
| **Guest Starting XP** | `1,420 XP` | `src/App.tsx:50` | Hardcoded initial state `useState(1420)` | **FABRICATED** | Fresh guests start at `0 XP`. |
| **Guest Starting ELO** | `1,450 ELO` | `src/App.tsx:51` | Hardcoded initial state `useState(1450)` | **FABRICATED** | Fresh guests start unranked (`1000 ELO` baseline for calibration). |
| **Guest Rank Tier** | `Gold II` | `src/App.tsx:52` | Hardcoded initial state `useState('Gold II')` | **FABRICATED** | Fresh guests start at `'Unranked'` or `'Placement (0/5)'`. |
| **Weekly Top Doodlers** | `18,420`, `16,190`, `14,880` | `MainLobbyView.tsx:630–700`, `Database.ts:98–140` | Hardcoded static JSX elements and pre-seeded mock records in local JSON DB | **FABRICATED** | Query real database via `/api/leaderboard`. If no match history exists, render genuine empty state. |
| **Word of the Day Count** | `"Rollercoaster" doodled over 3,400 times` | `MainLobbyView.tsx:715–719` | Hardcoded static JSX marketing string | **FABRICATED** | Compute actual draw frequency from database `artworks` collection or display truthful curated word pack showcase without fake counter. |
| **Room Player Count** | `6.4k Playing` | `MainLobbyView.tsx:325` | Hardcoded static JSX badge | **FABRICATED** | Calculate from total players across active rooms (`roomManager.getTotalActivePlayers()`). |
| **Shop XP Catalog** | Beret: 500 XP, Beats: 1,200 XP, Crown: 5,000 XP | `server/index.ts:75–123` | Server in-memory REST endpoint `/api/shop/items` | **VALID STATIC DATA** | Authorized static cosmetic catalog with real XP balance verification. |
| **Tournament Bracket** | Summer Masters Cup 16-player bracket | `server/game/TournamentService.ts` | Dynamic in-memory bracket model | **VALID DYNAMIC DATA** | Authorized tournament state. |

---

## 3. Deep-Dive Analysis of Data Sources

### 3.1 Online Presence Tracking
- **Current Defect:**
  In `server/index.ts`:
  ```ts
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      game: 'Doodle Arena',
      version: '1.0.0',
      timestamp: Date.now(),
      onlineArtists: 14820 + Math.floor(Math.random() * 50),
    });
  });
  ```
  In `src/components/common/AppHeader.tsx`:
  ```tsx
  export const AppHeader: React.FC<AppHeaderProps> = ({
    onlineCount = 14820,
    ...
  ```
- **Correction Directive:**
  - In `server/index.ts`:
    ```ts
    const activeSockets = io.engine.clientsCount || io.sockets.sockets.size;
    res.json({
      status: 'ok',
      onlineArtists: Math.max(1, activeSockets),
      activeRooms: roomManager.getActiveRoomCount(),
    });
    ```
  - In `AppHeader.tsx`: Default `onlineCount` to `1` (the user themselves) instead of `14820`.

---

### 3.2 Guest Session Initialization and Progression
- **Current Defect:**
  In `src/App.tsx`:
  ```ts
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem('doodle_player_name') || 'SpeedyPencil_99'
  );
  const [userLevel, setUserLevel] = useState(24);
  const [userXp, setUserXp] = useState(1420);
  const [userElo, setUserElo] = useState(1450);
  const [userRankTier, setUserRankTier] = useState('Gold II');
  ```
  Every user opening the application in an incognito window or on a fresh computer is instantly attributed Level 24 with 1,420 XP, Gold II rank, and the nickname SpeedyPencil_99.
- **Correction Directive:**
  ```ts
  const getInitialGuestName = (): string => {
    const saved = localStorage.getItem('doodle_player_name');
    if (saved) return saved;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `Guest_${randomSuffix}`;
  };

  const [userName, setUserName] = useState<string>(getInitialGuestName);
  const [userLevel, setUserLevel] = useState<number>(() => {
    const saved = localStorage.getItem('doodle_player_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [userXp, setUserXp] = useState<number>(() => {
    const saved = localStorage.getItem('doodle_player_xp');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [userElo, setUserElo] = useState<number>(() => {
    const saved = localStorage.getItem('doodle_player_elo');
    return saved ? parseInt(saved, 10) : 1000;
  });
  const [userRankTier, setUserRankTier] = useState<string>(() => {
    const saved = localStorage.getItem('doodle_player_rank');
    return saved || 'Unranked';
  });
  ```
  Persist XP and Level increases only upon verified game completions.

---

### 3.3 Matchmaking Queue Latency
- **Current Defect:**
  `MainLobbyView.tsx:277`:
  ```tsx
  <span className="text-xs font-bold text-on-surface">Avg. queue: 1.8s</span>
  ```
- **Correction Directive:**
  - Create real matchmaking latency metric in `CompetitiveService.ts`:
    Record the duration between queue entry and room assignment.
  - If fewer than 3 recent queue matches exist in the running server session, render:
    `"Avg. queue: < 5s"` or `"Instant Play Ready"`.

---

### 3.4 Leaderboard & Word of the Day Truthfulness
- **Current Defect:**
  In `MainLobbyView.tsx`, the "Weekly Top Doodlers" card hardcodes:
  - DoodleQueen: 18,420 PTS
  - NeonSketcher: 16,190 PTS
  - BananaCanvas: 14,880 PTS
  And the "Community Spotlight" card claims:
  - "Doodled over 3,400 times this weekend!"
- **Correction Directive:**
  - Fetch genuine leaderboard data dynamically from `/api/leaderboard`.
  - In `Database.ts`: Cleanly separate seeded demo records from genuine production records. If zero real matches have been played, render an elegant empty state:
    > "No ranked matches completed this week. Play casual or competitive games to climb to Rank #1!"
  - For Word of the Day, query actual database artwork counts for that word:
    If zero artworks exist, display: `"Today's Curated Challenge: 'Rollercoaster' • Draw it first in Custom Room!"` without fabricating a 3,400 counter.

---

## 4. LocalStorage Key Catalog

To prevent stale session pollution, all client storage keys are explicitly audited:

| Key Name | Type | Expected Default | Description |
|---|---|---|---|
| `doodle_player_name` | string | `Guest_XXXX` | User's preferred display name |
| `doodle_player_avatar` | JSON string | `{ style: 'cat', hat: 'beret', color: '#7C3AED' }` | Selected avatar configuration |
| `doodle_player_level` | integer string | `'1'` | Verified player progression level |
| `doodle_player_xp` | integer string | `'0'` | Accumulated experience points |
| `doodle_player_elo` | integer string | `'1000'` | Competitive matchmaking rating |
| `doodle_player_rank` | string | `'Unranked'` | Displayed competitive tier |

Any missing key cleanly falls back to its truthful unranked starting baseline.
