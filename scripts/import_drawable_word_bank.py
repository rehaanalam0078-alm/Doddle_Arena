#!/usr/bin/env python3
"""
Doodle Arena — Word Bank Ingestion & Validation Pipeline
Imports, validates, and partitions drawable_word_bank_v2.json into:
1. Production Active Word Bank (data/word_bank_active.json)
2. Staging Candidate Word Bank (data/word_bank_candidates.json)
3. Vocabulary Metadata & Index (data/word_bank_metadata.json)

Ensures idempotent, transactional execution with strict schema validation.
"""

import os
import sys
import json
import argparse
from typing import Dict, List, Any, Set

EXPECTED_TOTAL_RECORDS = 2746
EXPECTED_UNIQUE_WORDS = 2744
EXPECTED_ACTIVE_RECORDS = 2124
EXPECTED_CANDIDATE_RECORDS = 622

REQUIRED_FIELDS = {
    "id",
    "word",
    "normalized_word",
    "difficulty",
    "category",
    "status",
    "drawability_type",
    "word_length",
    "word_count",
}

VALID_DIFFICULTIES = {"easy", "medium", "hard"}
VALID_STATUSES = {"active", "candidate_review"}


def validate_entry(entry: Dict[str, Any], index: int) -> List[str]:
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in entry:
            errors.append(f"Entry #{index} ({entry.get('id', 'unknown')}): Missing required field '{field}'")

    diff = entry.get("difficulty")
    if diff not in VALID_DIFFICULTIES:
        errors.append(f"Entry #{index} ({entry.get('id')}): Invalid difficulty '{diff}'")

    status = entry.get("status")
    if status not in VALID_STATUSES:
        errors.append(f"Entry #{index} ({entry.get('id')}): Invalid status '{status}'")

    word = entry.get("word")
    if not word or not isinstance(word, str) or not word.strip():
        errors.append(f"Entry #{index} ({entry.get('id')}): Empty or non-string word")

    return errors


def run_import(input_file: str, output_dir: str, dry_run: bool = False) -> Dict[str, Any]:
    print(f"[*] Reading source word bank from: {input_file}")
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Source file not found: {input_file}")

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries: List[Dict[str, Any]] = data.get("entries", [])
    total_entries = len(entries)
    print(f"[*] Loaded {total_entries} records from JSON file.")

    if total_entries != EXPECTED_TOTAL_RECORDS:
        print(f"[!] Warning: Expected {EXPECTED_TOTAL_RECORDS} records, found {total_entries}")

    # Validate all entries
    all_errors = []
    seen_ids: Set[str] = set()
    normalized_words: Set[str] = set()
    active_pool: List[Dict[str, Any]] = []
    candidate_pool: List[Dict[str, Any]] = []

    difficulty_counts = {"easy": 0, "medium": 0, "hard": 0}
    category_counts: Dict[str, int] = {}

    for idx, entry in enumerate(entries):
        entry_errors = validate_entry(entry, idx)
        if entry_errors:
            all_errors.extend(entry_errors)

        rec_id = entry.get("id", "")
        if rec_id in seen_ids:
            all_errors.append(f"Duplicate record ID found: {rec_id}")
        seen_ids.add(rec_id)

        norm_word = entry.get("normalized_word", "").lower().strip()
        normalized_words.add(norm_word)

        diff = entry.get("difficulty", "medium")
        if diff in difficulty_counts:
            difficulty_counts[diff] += 1

        cat = entry.get("category", "General")
        category_counts[cat] = category_counts.get(cat, 0) + 1

        # Partition into Active (Production) vs Candidate (Staging)
        status = entry.get("status", "candidate_review")
        if status == "active":
            active_pool.append(entry)
        else:
            candidate_pool.append(entry)

    if all_errors:
        print(f"[X] Validation failed with {len(all_errors)} errors:")
        for err in all_errors[:10]:
            print(f"    - {err}")
        if len(all_errors) > 10:
            print(f"    ... and {len(all_errors) - 10} more errors.")
        raise ValueError(f"Import aborted due to {len(all_errors)} validation errors.")

    print(f"[✓] Validation passed: 0 errors.")
    print(f"    - Active Production Words: {len(active_pool)}")
    print(f"    - Candidate Review Words:  {len(candidate_pool)}")
    print(f"    - Unique Normalized Words: {len(normalized_words)}")
    print(f"    - Difficulty Distribution: {difficulty_counts}")
    print(f"    - Categories:              {len(category_counts)} unique categories")

    stats = {
        "dataset_name": data.get("dataset_name", "Doodle Arena Drawable Word Bank"),
        "dataset_version": data.get("dataset_version", "2.0.0"),
        "imported_at": data.get("generated_on", "2026-11-16"),
        "total_records": total_entries,
        "unique_normalized_words": len(normalized_words),
        "active_records": len(active_pool),
        "candidate_records": len(candidate_pool),
        "difficulty": difficulty_counts,
        "active_by_difficulty": {
            "easy": sum(1 for e in active_pool if e.get("difficulty") == "easy"),
            "medium": sum(1 for e in active_pool if e.get("difficulty") == "medium"),
            "hard": sum(1 for e in active_pool if e.get("difficulty") == "hard"),
        },
        "candidate_by_difficulty": {
            "easy": sum(1 for e in candidate_pool if e.get("difficulty") == "easy"),
            "medium": sum(1 for e in candidate_pool if e.get("difficulty") == "medium"),
            "hard": sum(1 for e in candidate_pool if e.get("difficulty") == "hard"),
        },
        "categories_count": len(category_counts),
    }

    if dry_run:
        print("[*] Dry run enabled. Skipping file writes.")
        return stats

    os.makedirs(output_dir, exist_ok=True)

    active_path = os.path.join(output_dir, "word_bank_active.json")
    candidate_path = os.path.join(output_dir, "word_bank_candidates.json")
    metadata_path = os.path.join(output_dir, "word_bank_metadata.json")

    # Atomic write pattern
    temp_active = active_path + ".tmp"
    temp_candidate = candidate_path + ".tmp"
    temp_metadata = metadata_path + ".tmp"

    try:
        with open(temp_active, "w", encoding="utf-8") as f:
            json.dump(active_pool, f, indent=2, ensure_ascii=False)
        os.replace(temp_active, active_path)
        print(f"[✓] Written active word bank ({len(active_pool)} items) to: {active_path}")

        with open(temp_candidate, "w", encoding="utf-8") as f:
            json.dump(candidate_pool, f, indent=2, ensure_ascii=False)
        os.replace(temp_candidate, candidate_path)
        print(f"[✓] Written candidate review bank ({len(candidate_pool)} items) to: {candidate_path}")

        with open(temp_metadata, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
        os.replace(temp_metadata, metadata_path)
        print(f"[✓] Written dataset metadata to: {metadata_path}")

    finally:
        for temp_f in [temp_active, temp_candidate, temp_metadata]:
            if os.path.exists(temp_f):
                try:
                    os.remove(temp_f)
                except OSError:
                    pass

    return stats


def main():
    parser = argparse.ArgumentParser(description="Import and validate Doodle Arena expanded word bank")
    parser.add_argument("--input", default="drawable_word_bank_v2.json", help="Path to input JSON word bank")
    parser.add_argument("--output-dir", default="data", help="Output directory for partitioned JSON files")
    parser.add_argument("--dry-run", action="store_true", help="Validate without writing files")

    args = parser.parse_args()

    # Resolve relative to project root if needed
    input_file = os.path.abspath(args.input)
    output_dir = os.path.abspath(args.output_dir)

    try:
        stats = run_import(input_file, output_dir, dry_run=args.dry_run)
        print(f"\n[SUCCESS] Word bank pipeline complete. Version {stats['dataset_version']}")
    except Exception as e:
        print(f"\n[FATAL ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
