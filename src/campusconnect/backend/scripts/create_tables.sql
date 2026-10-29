-- ============================================================
-- CampusConnect — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Colleges ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
    id          TEXT PRIMARY KEY,               -- e.g. "KLU"
    name        TEXT NOT NULL,
    short_name  TEXT NOT NULL,
    email_domain TEXT NOT NULL UNIQUE,          -- e.g. "kluniversity.in"
    city        TEXT,
    state       TEXT,
    country     TEXT DEFAULT 'India',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Blocks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id  TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,                  -- e.g. "Main Block"
    short_name  TEXT NOT NULL,                  -- e.g. "MB"
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Rooms ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id        UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    room_number     TEXT NOT NULL,              -- e.g. "101", "K-205"
    capacity        INTEGER NOT NULL CHECK (capacity > 0),
    room_type       TEXT NOT NULL DEFAULT 'classroom',
                    -- classroom | lab | auditorium | seminar_hall | conference
    floor           INTEGER,
    amenities       TEXT[] DEFAULT '{}',        -- ["projector", "whiteboard"]
    is_sample_data  BOOLEAN DEFAULT TRUE,       -- flag for placeholder data
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(block_id, room_number)
);

-- ─── User Profiles (extends Supabase auth.users) ──────────────────────────────
CREATE TABLE IF NOT EXISTS users_profile (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    email               TEXT NOT NULL,
    role                TEXT NOT NULL DEFAULT 'student'
                        CHECK (role IN ('student', 'organizer', 'admin')),
    college_id          TEXT REFERENCES colleges(id),
    college_verified    BOOLEAN DEFAULT FALSE,
    college_email       TEXT,
    location            TEXT,
    avatar_url          TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── User Preferences (survey answers) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users_profile(id) ON DELETE CASCADE,
    interests           TEXT[] DEFAULT '{}',
    preferred_mode      TEXT DEFAULT 'both'
                        CHECK (preferred_mode IN ('online', 'offline', 'hybrid', 'both')),
    preferred_location  TEXT DEFAULT '',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Events ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    category            TEXT NOT NULL,
    tags                TEXT[] DEFAULT '{}',
    event_type          TEXT DEFAULT 'general'
                        CHECK (event_type IN ('general', 'college')),
    location            TEXT NOT NULL,
    city                TEXT NOT NULL,
    date                DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    mode                TEXT NOT NULL DEFAULT 'offline'
                        CHECK (mode IN ('online', 'offline', 'hybrid')),
    college_scope       BOOLEAN DEFAULT FALSE,
    college_id          TEXT REFERENCES colleges(id),
    expected_participants INTEGER,
    capacity            INTEGER,
    organizer           TEXT NOT NULL,
    organizer_id        UUID REFERENCES users_profile(id),
    poster_url          TEXT,
    room_id             UUID REFERENCES rooms(id),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_id) WHERE college_scope = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);

-- ─── Event Registrations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_registrations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- ─── Event Saves (bookmarks) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_saves (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- ─── Event Ratings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_ratings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- ─── Event Interactions (for recommendation engine) ───────────────────────────
CREATE TABLE IF NOT EXISTS event_interactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    viewed          BOOLEAN DEFAULT FALSE,
    saved           BOOLEAN DEFAULT FALSE,
    registered      BOOLEAN DEFAULT FALSE,
    attended        BOOLEAN DEFAULT FALSE,
    rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_interactions_user ON event_interactions(user_id);

-- ─── Event Attendance ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_attendance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    entry_time          TIMESTAMPTZ,
    exit_time           TIMESTAMPTZ,
    entry_verified      BOOLEAN DEFAULT FALSE,
    exit_verified       BOOLEAN DEFAULT FALSE,
    attendance_verified BOOLEAN DEFAULT FALSE,
    sil_credit          BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- ─── SIL Semesters ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sil_semesters (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,                  -- e.g. "Odd Semester 2025-26"
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_active   BOOLEAN DEFAULT FALSE,
    college_id  TEXT REFERENCES colleges(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SIL Participation ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sil_participation (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    semester_id     UUID NOT NULL REFERENCES sil_semesters(id) ON DELETE CASCADE,
    events_attended INTEGER DEFAULT 0,
    last_event_id   UUID REFERENCES events(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, semester_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users_profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_saves       ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ratings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sil_participation ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own profile
CREATE POLICY "users_profile_self" ON users_profile
    FOR ALL USING (auth.uid() = id);

-- Users can read/write their own preferences
CREATE POLICY "user_preferences_self" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Users can read/write their own registrations
CREATE POLICY "registrations_self" ON event_registrations
    FOR ALL USING (auth.uid() = user_id);

-- Users can read/write their own saves
CREATE POLICY "saves_self" ON event_saves
    FOR ALL USING (auth.uid() = user_id);

-- Users can read/write their own ratings
CREATE POLICY "ratings_self" ON event_ratings
    FOR ALL USING (auth.uid() = user_id);

-- Users can read/write their own interactions
CREATE POLICY "interactions_self" ON event_interactions
    FOR ALL USING (auth.uid() = user_id);

-- Users can read/write their own attendance
CREATE POLICY "attendance_self" ON event_attendance
    FOR ALL USING (auth.uid() = user_id);

-- Users can read their own SIL records
CREATE POLICY "sil_self" ON sil_participation
    FOR ALL USING (auth.uid() = user_id);

-- Events: publicly readable (general events), college events require verification
-- (Detailed filtering handled in FastAPI using service-role key)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON events
    FOR SELECT USING (is_active = TRUE AND college_scope = FALSE);
CREATE POLICY "events_college_read" ON events
    FOR SELECT USING (
        is_active = TRUE AND college_scope = TRUE AND
        EXISTS (
            SELECT 1 FROM users_profile
            WHERE id = auth.uid()
            AND college_verified = TRUE
            AND college_id = events.college_id
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA — KL University
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO colleges (id, name, short_name, email_domain, city, state)
VALUES ('KLU', 'KL University', 'KLU', 'kluniversity.in', 'Vijayawada', 'Andhra Pradesh')
ON CONFLICT (id) DO NOTHING;

-- Blocks (SAMPLE DATA — update with actual KLU room data before production)
WITH klu_college AS (SELECT id FROM colleges WHERE id = 'KLU')
INSERT INTO blocks (college_id, name, short_name)
SELECT 'KLU', 'Main Block', 'MB'
WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE college_id = 'KLU' AND short_name = 'MB');

WITH klu_college AS (SELECT id FROM colleges WHERE id = 'KLU')
INSERT INTO blocks (college_id, name, short_name)
SELECT 'KLU', 'Kanchan Block', 'KB'
WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE college_id = 'KLU' AND short_name = 'KB');

-- Sample rooms for Main Block (SAMPLE DATA — replace with actual KLU room data)
INSERT INTO rooms (block_id, room_number, capacity, room_type, floor, amenities, is_sample_data)
SELECT b.id, 'MB-101', 60, 'classroom', 1, ARRAY['projector', 'whiteboard'], TRUE
FROM blocks b WHERE b.short_name = 'MB' AND b.college_id = 'KLU'
AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.block_id = b.id AND r.room_number = 'MB-101');

INSERT INTO rooms (block_id, room_number, capacity, room_type, floor, amenities, is_sample_data)
SELECT b.id, 'MB-201', 75, 'classroom', 2, ARRAY['projector', 'whiteboard', 'AC'], TRUE
FROM blocks b WHERE b.short_name = 'MB' AND b.college_id = 'KLU'
AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.block_id = b.id AND r.room_number = 'MB-201');

INSERT INTO rooms (block_id, room_number, capacity, room_type, floor, amenities, is_sample_data)
SELECT b.id, 'MB-Audi', 400, 'auditorium', 0, ARRAY['projector', 'mic', 'AC', 'stage'], TRUE
FROM blocks b WHERE b.short_name = 'MB' AND b.college_id = 'KLU'
AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.block_id = b.id AND r.room_number = 'MB-Audi');

-- Sample rooms for Kanchan Block
INSERT INTO rooms (block_id, room_number, capacity, room_type, floor, amenities, is_sample_data)
SELECT b.id, 'KB-101', 80, 'classroom', 1, ARRAY['projector', 'whiteboard', 'AC'], TRUE
FROM blocks b WHERE b.short_name = 'KB' AND b.college_id = 'KLU'
AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.block_id = b.id AND r.room_number = 'KB-101');

INSERT INTO rooms (block_id, room_number, capacity, room_type, floor, amenities, is_sample_data)
SELECT b.id, 'KB-Lab1', 50, 'lab', 1, ARRAY['computers', 'projector'], TRUE
FROM blocks b WHERE b.short_name = 'KB' AND b.college_id = 'KLU'
AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.block_id = b.id AND r.room_number = 'KB-Lab1');

INSERT INTO rooms (block_id, room_number, capacity, room_type, floor, amenities, is_sample_data)
SELECT b.id, 'KB-Seminar', 120, 'seminar_hall', 2, ARRAY['projector', 'mic', 'AC'], TRUE
FROM blocks b WHERE b.short_name = 'KB' AND b.college_id = 'KLU'
AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.block_id = b.id AND r.room_number = 'KB-Seminar');

-- Active SIL Semester
INSERT INTO sil_semesters (name, start_date, end_date, is_active, college_id)
VALUES ('Odd Semester 2025-26', '2025-07-01', '2025-12-31', TRUE, 'KLU')
ON CONFLICT DO NOTHING;
