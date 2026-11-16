# Doodle Arena — Word Database Audit Report (Part 1)
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**File Inspected:** `drawable_word_bank_v2.json`  
**Location:** `c:\Users\rehaa\Desktop\Doddle Arena\drawable_word_bank_v2.json`  
**File Size:** 2,604,517 bytes (2.48 MB)  
**Schema & Dataset Version:** 2.0.0

---

## 1. Executive Summary

An exhaustive audit of the newly uploaded dataset `drawable_word_bank_v2.json` was conducted directly against disk. All dataset metadata claims were mathematically verified and validated.

The dataset contains **2,746 records** across **2,744 unique normalized English words**. The records are clearly segregated by review status into an active production tier (2,124 records) and a candidate-review staging tier (622 records).

---

## 2. Statistical Verification

| Metric | Metadata Claim | Verified Value | Discrepancy |
|---|---|---|---|
| **Total Records** | 2,746 | 2,746 | None (Exact) |
| **Unique Normalized Words** | 2,744 | 2,744 | None (Exact) |
| **Active Records** | 2,124 | 2,124 | None (Exact) |
| **Candidate Review Records** | 622 | 622 | None (Exact) |
| **Easy Difficulty** | 892 | 892 | None (Exact) |
| **Medium Difficulty** | 1,317 | 1,317 | None (Exact) |
| **Hard Difficulty** | 537 | 537 | None (Exact) |
| **User Uploaded Origin (v1)** | 2,015 | 2,015 | None (Exact) |
| **Google QuickDraw Origin** | 109 | 109 | None (Exact) |
| **Curated Expansion Origin** | 622 | 622 | None (Exact) |

### 2.1 Tiered Difficulty Cross-Tabulation

| Difficulty | Active Production Tier | Candidate Review Tier | Total Records |
|---|---|---|---|
| **Easy** | 680 | 212 | **892** |
| **Medium** | 1,040 | 277 | **1,317** |
| **Hard** | 404 | 133 | **537** |
| **Total** | **2,124** | **622** | **2,746** |

---

## 3. Schema & Field Inventory

Every record in `drawable_word_bank_v2.json` conforms to a consistent JSON structure containing the following 28 fields:

| Field Name | Type | Description | Sample Value |
|---|---|---|---|
| `id` | string | Unique record identifier (`DAW-XXXXXX`) | `"DAW-000001"` |
| `word` | string | Display capitalized spelling | `"Climbing"` |
| `normalized_word` | string | Lowercased normalized form | `"climbing"` |
| `sense_id` | string | WordNet synset or lexical sense disambiguator | `"climbing.v.01"` |
| `language` | string | ISO 639-1 language code | `"en"` |
| `part_of_speech` | string | Syntactic category (`noun`, `verb`, `adjective`) | `"verb"` |
| `difficulty` | string | Game tier: `'easy'`, `'medium'`, `'hard'` | `"easy"` |
| `category` | string | Primary semantic domain (82 distinct categories) | `"Actions and Activities"` |
| `subcategory` | string | Specific thematic grouping | `"Movement"` |
| `category_visible` | boolean | Category visibility hint | `true` |
| `drawability_type` | string | Drawability classification | `"action"`, `"direct"` |
| `visual_complexity` | integer | Perceptual drawing rating (1 to 5) | `2` |
| `word_length` | integer | Character count (excluding spaces/hyphens) | `8` |
| `word_count` | integer | Token count in compound phrases | `1` |
| `syllable_count` | integer | Pronunciation syllable count | `1` |
| `aliases` | string[] | Approved alternate correct guesses | `["scale", "mountaineer"]` |
| `regional_variants` | string[] | Regional orthographic variants (UK/US) | `["colour", "color"]` |
| `gloss` | string | Visual definition / prompt hint | `"Person scaling a ladder or rock wall"` |
| `is_child_friendly` | boolean | G-rated content flag | `true` |
| `is_validated` | boolean | Manual verification indicator | `true` |
| `source_ids` | string[] | External provenance references | `["SOURCE-001", "SOURCE-002"]` |
| `dataset_version` | string | Source release version | `"2.0.0"` |
| `status` | string | Ingestion state: `'active'` or `'candidate_review'` | `"active"` |
| `origin` | string | Dataset pedigree | `"user_uploaded_word_bank_v1"` |
| `evidence_class` | string | Corroboration classification | `"existing_dataset_entry"` |
| `review_recommendation` | string | Governance action advice | `"audit_quality_before_public_launch"` |
| `external_evidence` | object | Dictionary / corpora validation signals | `{}` |
| `lexical_check` | object | Punctuation / token verification notes | `{}` |

---

## 4. Drawability Classification Breakdown

The dataset categorizes how concepts are represented visually on a 2D canvas:
- `direct` (1,961 records): Concrete nouns (e.g. `Banana`, `Castle`, `Giraffe`, `Telescope`).
- `direct_or_action` (622 records): Curated expansion candidates with dual object/verb interpretations.
- `source_observed_prompt` (109 records): Derived from empirical QuickDraw sketching challenges.
- `scene` (34 records): Environmental and composite settings (e.g. `Camping`, `Thunderstorm`).
- `action` (15 records): Verbs and kinetic activities (e.g. `Climbing`, `Surfing`, `Juggling`).
- `symbolic` (5 records): Abstract icons with standard iconography (e.g. `Peace`, `Heart`).

---

## 5. Duplicate and Polysemy Analysis

There are exactly **two pairs of polysemous words** (words sharing the same spelling but representing distinct lexical senses):
1. **`tent`**:
   - `DAW-000010`: Sense `tent.n.02`, Category `"Adventure Equipment"` (Portable camping shelter).
   - `DAW-000109`: Sense `tent.n.01`, Category `"Buildings"` (Permanent/event canopy pavilion).
2. **`bat`**:
   - `DAW-000016`: Sense `bat.n.01`, Category `"Animals"` (Nocturnal winged mammal).
   - `DAW-000536`: Sense `bat.n.02`, Category `"Sports"` (Baseball/cricket wooden club).

### Resolution Protocol
Both records are retained to preserve their distinct categories, senses, and visual definitions. In game matches:
- Deduplication occurs at selection time: the game engine will never present both senses of `bat` or `tent` in the same 3-word selection palette.
- Guess validation for either `bat` or `tent` awards points immediately.

---

## 6. Aliases and Regional Orthography

- **226 records** contain populated `aliases` (e.g., `automobile` $\to$ `car`, `couch` $\to$ `sofa`, `cinema` $\to$ `movie theater`).
- **20 records** contain `regional_variants` (e.g. British vs. American English spellings).
- The guess evaluation engine must cross-reference `aliases` and `regional_variants` so players entering an approved alias receive immediate solve credit.

---

## 7. Category Distribution

The dataset spans **82 distinct categories**. The top 10 categories by volume are:
1. `Animals` (330 words)
2. `Marine Life` (144 words)
3. `Plants and Flowers` (133 words)
4. `Furniture` (110 words)
5. `Fruits and Vegetables` (104 words)
6. `Buildings` (98 words)
7. `Kitchen Equipment` (85 words)
8. `Insects` (84 words)
9. `Food` (77 words)
10. `Birds` (76 words)

---

## 8. Data Quality Conclusion & Readiness

The `drawable_word_bank_v2.json` file is structurally sound, clean, and ready for transactional import.
- Active records: **2,124** will be indexed for live gameplay.
- Candidate-review records: **622** will be staged separately for administrative approval and review.
- The original file will remain pristine and unmodified on disk.
