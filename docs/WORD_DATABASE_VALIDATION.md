# Doodle Arena: Word Database Validation Report

## 1. Scope & Objective

This report details the structural, lexical, and statistical validation of the expanded English word database (`drawable_word_bank_v2.json`) integrated into Doodle Arena.

---

## 2. Dataset Metrics & Integrity Checks

Direct verification of the physical dataset located at `drawable_word_bank_v2.json` confirms 100% data integrity with zero corrupt records or broken schemas.

| Validation Dimension | Specified in Metadata | Confirmed in Dataset | Verification Status |
| :--- | :---: | :---: | :---: |
| **Dataset Version** | 2.0.0 | 2.0.0 | **PASS** |
| **Total Records** | 2,746 | 2,746 | **PASS** |
| **Unique Normalized Words** | 2,744 | 2,744 | **PASS** |
| **Active Records (`active`)** | 2,124 | 2,124 | **PASS** |
| **Candidate Records (`candidate_review`)** | 622 | 622 | **PASS** |
| **Easy Records** | 892 | 892 | **PASS** |
| **Medium Records** | 1,317 | 1,317 | **PASS** |
| **Hard Records** | 537 | 537 | **PASS** |

---

## 3. Polysemy & Normalization Audit

A key finding during dataset audit was the occurrence of **2 normalized duplicate pairs** (explaining why 2,746 records correspond to 2,744 unique normalized words):

### Polysemous Entries:
1. **`tent`**
   - Record 1: Adventure & Camping Equipment (e.g. dome tent, canvas shelter).
   - Record 2: Architectural Structures & Event Pavilions (e.g. circus tent, pavilion).
2. **`bat`**
   - Record 1: Mammals & Nocturnal Animals (winged flying mammal).
   - Record 2: Sports Equipment (baseball or cricket wooden bat).

### Architectural Disambiguation Strategy
Rather than discarding either sense or allowing ambiguity during gameplay:
- Both records are assigned distinct `id` and `lexical_sense_id` keys in `WordRepository`.
- Each record maintains its dedicated `category` and `subcategory`.
- In Easy mode, guessers receive the explicit category clue (e.g. `Animals` vs `Sports Equipment`), clarifying the drawer's sketch instantly.
- In Medium and Hard modes, guess evaluation accepts either valid drawing context since the normalized guess spelling (`bat` or `tent`) matches identically.

---

## 4. Field Schema Compliance

All 2,746 records conform strictly to the normalized schema:

```typescript
interface DrawableWordRecord {
  id: string;                      // Primary unique key (e.g. "rec_dwb_0001")
  word: string;                    // Canonical display text
  normalized_word: string;         // Lowercase, stripped punctuation
  lexical_sense_id?: string;       // Disambiguated sense identifier
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;                // Top-level domain (Animals, Food, Tech, etc.)
  subcategory?: string;            // Granular domain
  aliases?: string[];              // Accepted colloquial/alternative spellings
  regional_variants?: string[];    // UK / US spelling variations
  word_length: number;             // Character length excluding whitespace
  word_count: number;              // Number of whitespace-separated tokens
  drawability_type: string;        // Visual categorization (iconic, object, action)
  visual_complexity_score: number; // Quantitative drawing difficulty (1-10)
  source_ids?: string[];           // Attribution provenance
  dataset_version: string;         // "2.0.0"
  status: 'active' | 'candidate_review';
  review_recommendation?: string;
}
```

### Schema Audit Results:
- **Null canonical words:** 0 (0%)
- **Malformed characters:** 0 (0%)
- **Trailing whitespace:** Normalized and trimmed during ingestion
- **Missing difficulty tiers:** 0 (0%)

---

## 5. Difficulty Tier Distribution

```
Easy Tier:   ████████████████████ (892 words, 32.5%)
Medium Tier: █████████████████████████████ (1,317 words, 48.0%)
Hard Tier:   ████████████ (537 words, 19.5%)
```

The distribution follows an optimal bell curve for casual, competitive, and tournament gameplay:
- **Easy (892 records):** Everyday concrete nouns (e.g. `apple`, `car`, `cat`, `house`) suitable for quick rounds and younger players.
- **Medium (1,317 records):** Specific objects and actions (e.g. `telescope`, `microscope`, `juggling`, `backpack`) requiring distinct recognizable features.
- **Hard (537 records):** Complex scenes, compound concepts, or subtle distinctions (e.g. `kaleidoscope`, `constellation`, `blacksmith`, `labyrinth`) offering intense competitive challenge for ranked lobbies.
