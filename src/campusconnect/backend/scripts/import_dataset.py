"""
Dataset Import Script — CampusConnect
Reads the 4 CSV files and upserts them into Supabase.

Usage:
    cd backend
    copy .env.example .env  (then fill in your Supabase credentials)
    .\\venv\\Scripts\\python scripts\\import_dataset.py

Flags:
    --validate-only   Validate CSV files without inserting into DB
    --events-only     Import only events
"""

import sys, os, csv
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

import argparse
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DATASET_DIR = Path(__file__).parent.parent / "dataset"

def get_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("[ERROR] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def parse_bool(val):
    if isinstance(val, bool):
        return val
    return str(val).lower() in ("true", "1", "yes")


def import_events(client, validate_only=False):
    path = DATASET_DIR / "events.csv"
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    valid, errors = [], []
    for i, row in enumerate(rows):
        if not row.get("event_id") or not row.get("title"):
            errors.append(f"Row {i+1}: missing event_id or title")
            continue

        record = {
            "id": row["event_id"],
            "title": row["title"].strip(),
            "description": row["description"].strip(),
            "category": row["category"].strip(),
            "tags": [t.strip() for t in row.get("tags", "").split("|") if t.strip()],
            "event_type": row.get("event_type", "general").strip(),
            "location": row.get("location", "").strip(),
            "city": row.get("city", "").strip(),
            "date": row.get("date", "").strip(),
            "start_time": row.get("start_time", "09:00:00").strip(),
            "end_time": row.get("end_time", "17:00:00").strip(),
            "mode": row.get("mode", "offline").strip(),
            "college_scope": parse_bool(row.get("college_scope", False)),
            "college_id": row.get("college_id", "").strip() or None,
            "expected_participants": int(row["expected_participants"]) if row.get("expected_participants") else None,
            "capacity": int(row["capacity"]) if row.get("capacity") else None,
            "organizer": row.get("organizer", "Unknown").strip(),
            "is_active": True,
        }
        valid.append(record)

    print(f"Events: {len(valid)} valid, {len(errors)} errors")
    for err in errors[:5]:
        print(f"  [WARN] {err}")

    if not validate_only and valid:
        result = client.table("events").upsert(valid).execute()
        print(f"  Inserted/updated {len(result.data)} events")
    return len(valid)


def import_users(client, validate_only=False):
    """
    Users from CSV are demo/synthetic profiles only.
    We do NOT create real Supabase auth users from this CSV.
    Instead, we create users_profile rows for demo accounts.
    Real auth users are created via /api/auth/register.
    """
    path = DATASET_DIR / "users.csv"
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"Users CSV: {len(rows)} synthetic user profiles (not creating auth accounts)")
    print("  NOTE: Synthetic users are for dataset statistics only.")
    print("  Real accounts are created via /register endpoint.")

    # We just count them — don't insert into auth.users (would need real emails/passwords)
    if not validate_only:
        print("  [SKIP] Skipping auth user creation for synthetic users")
    return len(rows)


def import_interactions(client, csv_user_map: dict, csv_event_map: dict, validate_only=False):
    """
    Interactions reference synthetic user_ids and event_ids from CSV.
    Since we can't map to real auth user UUIDs without creating accounts,
    we import only for events (so dataset stats work via the events table).
    """
    path = DATASET_DIR / "interactions.csv"
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Interactions CSV: {len(rows)} records (used for recommendation demo)")
    print("  NOTE: Interaction import requires real user accounts to link properly.")
    print("  Run the demo flow via the UI to generate real interaction data.")
    return len(rows)


def import_attendance(client, validate_only=False):
    path = DATASET_DIR / "attendance.csv"
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Attendance CSV: {len(rows)} records (used for dataset stats page)")
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import CampusConnect dataset into Supabase")
    parser.add_argument("--validate-only", action="store_true", help="Validate without inserting")
    parser.add_argument("--events-only", action="store_true", help="Import only events")
    args = parser.parse_args()

    client = get_client()
    validate_only = args.validate_only

    print("=" * 55)
    print("  CampusConnect Dataset Import")
    print("=" * 55)
    if validate_only:
        print("  MODE: Validation only (no DB writes)")
    print()

    events_count     = import_events(client, validate_only)
    users_count      = import_users(client, validate_only)
    if not args.events_only:
        interactions_count = import_interactions(client, {}, {}, validate_only)
        attendance_count   = import_attendance(client, validate_only)
    else:
        interactions_count, attendance_count = 0, 0

    print()
    print("=" * 55)
    print("  Import Summary")
    print("=" * 55)
    print(f"  Events:            {events_count}")
    print(f"  Users (CSV):       {users_count} (synthetic, not imported to auth)")
    print(f"  Interactions:      {interactions_count} (synthetic reference data)")
    print(f"  Attendance:        {attendance_count} (synthetic reference data)")
    print()
    print("  IMPORTANT: This is a SYNTHETIC dataset for prototype development.")
    print("  Real data will be collected after deployment.")
    print("=" * 55)
