# Doodle Arena: Expanded English Word Database Integration

## 1. Executive Summary

This document describes the architectural design, ingestion pipeline, runtime repository, and gameplay integration of the expanded English word bank (`drawable_word_bank_v2.json`) into Doodle Arena.

Prior versions of Doodle Arena relied on a small, hardcoded vocabulary array. The newly integrated dataset expands the playable vocabulary to **2,746 lexicographically verified, drawability-assessed English records** across **2,744 unique normalized words**, categorized and scored across three difficulty tiers.

---

## 2. Ingestion Pipeline & Partitioning

The dataset source file `drawable_word_bank_v2.json` (2.48 MB, Dataset Version 2.0.0) is preserved unmodified at the project root. The ingestion script (`scripts/import_drawable_word_bank.py`) processes the dataset idempotently and enforces a strict architectural boundary between production gameplay vocabulary and staged candidate vocabulary.

### Data Partitioning Architecture

```
                                  [ drawable_word_bank_v2.json ]
                                       (2,746 Records)
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                 Status: "active" (77.3%)         Status: "candidate_review" (22.7%)
                              │                               │
                              ▼                               ▼
                 [ data/word_bank_active.json ]   [ data/word_bank_candidates.json ]
                       (2,124 Records)                   (622 Records)
                              │                               │
                              ▼                               ▼
                    Live Gameplay Engine               Staging Pool
                   (Strict Difficulty Pools)     (Isolated from Public Matches)
```

### Partitioned Record Distribution

| Pool | Easy Tier | Medium Tier | Hard Tier | Total Records |
| :--- | :---: | :---: | :---: | :---: |
| **Active Production Pool** | 680 | 1,040 | 404 | **2,124** |
| **Candidate Review Pool** | 212 | 277 | 133 | **622** |
| **Combined Total** | **892** | **1,317** | **537** | **2,746** |

All records preserve their canonical metadata:
- Unique Record ID (e.g. `rec_dwb_0001`)
- Display Word (`word`) and Normalized Spelling (`normalized_word`)
- Lexical Sense ID (`lexical_sense_id`)
- Category & Subcategory
- Aliases & Regional Variants (e.g. British vs. American English)
- Word Length & Word Count
- Drawability Type & Visual Complexity Score
- Source Attribution ID & Dataset Version

---

## 3. Runtime Word Repository Architecture (`WordRepository.ts`)

The backend interfaces with the word bank via a dedicated singleton service, `WordRepository` (`server/db/WordRepository.ts`).

### Key Capabilities:
1. **In-Memory O(1) Indexing:**
   On server initialization, `WordRepository` loads `word_bank_active.json` and indexes entries by difficulty (`easy`, `medium`, `hard`) and builds a bidirectional alias resolution map.
2. **Strict Difficulty Segregation:**
   When a round initiates word selection, words are drawn strictly from the target difficulty tier. Easy, Medium, and Hard words are never intermingled.
3. **No-Repeat Guarantee:**
   `WordRepository.getRandomWordOptions(difficulty, count, excludedWords)` filters out words that have already appeared in the current match (tracked in `room.artworks`).
4. **Polysemy Disambiguation:**
   For polysemous entries (e.g. `tent` as Adventure Equipment vs. Building; `bat` as Animal vs. Sports Equipment), distinct lexical sense IDs and category associations are maintained so that the drawer and guessers see unambiguous contextual clues.

---

## 4. Difficulty Visibility Contract

The word database integration enforces a strict visibility contract across game modes:

```
┌────────────┬─────────────────────────────┬──────────────────────────┬────────────────────────┐
│ Difficulty │ Words Drawn From            │ Category Visible to Drawer│ Category Visible to Guesser│
├────────────┼─────────────────────────────┼──────────────────────────┼────────────────────────┤
│ EASY       │ Easy Pool Only (680 words)   │ YES                      │ YES                    │
│ MEDIUM     │ Medium Pool Only (1,040 w)  │ YES                      │ NO (Stripped)          │
│ HARD       │ Hard Pool Only (404 words)  │ YES                      │ NO (Stripped)          │
└────────────┴─────────────────────────────┴──────────────────────────┴────────────────────────┘
```

In Medium and Hard modes, the server strips `category` to an empty string in `toClientRoomState` for all guesser payloads, ensuring guessers only receive the letter count and masked clue dashes (`_ _ _ _ _`).

---

## 5. Alias & Regional Variant Resolution (`GuessService.ts`)

To prevent frustrating false negatives caused by valid alternative spellings or regional vocabulary (e.g. `donut` vs. `doughnut`, `color` vs. `colour`, `aeroplane` vs. `airplane`), `GuessService` checks the `WordRepository` alias graph:

1. Exact string match or space-collapsed match.
2. Alias & regional variant match: if `normalized_word` or any listed alias matches the user's guess, it evaluates as `isCorrect: true`.
3. Near-miss detection: Levenshtein distance $\le 1$ (or $\le 2$ for words with $\ge 7$ characters) triggers a private `guess:close` ("You're close!") notification without spoiling the answer to the room.

---

## 6. Vocabulary Governance & REST APIs

Doodle Arena exposes four administrative REST endpoints for vocabulary monitoring and candidate review:

- `GET /api/words/stats`:
  Returns dataset statistics, tier distributions, and active/candidate totals.
- `GET /api/words/candidates?page=1&limit=50`:
  Paginated access to candidate-review records for curation.
- `POST /api/words/candidates/:id/approve`:
  Promotes a candidate entry into the active production pool, immediately reindexing it for live gameplay and persisting the update.
- `POST /api/words/candidates/:id/reject`:
  Removes a candidate entry from the review staging pool and persists changes.
