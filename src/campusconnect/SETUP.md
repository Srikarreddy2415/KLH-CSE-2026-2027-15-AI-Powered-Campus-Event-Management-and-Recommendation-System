# CampusConnect — Setup & Run Guide

## Prerequisites
- Python 3.11+ installed
- Node.js 18+ installed  
- A Supabase account (free tier is fine)

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) → New Project
2. Name: `campusconnect` | Region: Asia South (Mumbai)
3. Wait for project to be ready

**Get your credentials** from **Project Settings → API**:
- `Project URL` → `SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY`
- `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Run Database Schema

1. In Supabase → **SQL Editor**
2. Open `backend/scripts/create_tables.sql`
3. Paste it and click **Run**
4. This creates all tables, RLS policies, and seeds KLU college data

---

## Step 3: Configure Backend

```powershell
cd campusconnect\backend
```

Edit `.env` and paste your credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=any-random-long-string
ENVIRONMENT=development
```

---

## Step 4: Configure Frontend

```powershell
cd campusconnect\frontend
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:8000
```

---

## Step 5: Import Dataset into Supabase

```powershell
cd campusconnect\backend
.\venv\Scripts\python scripts\import_dataset.py
```

This uploads all 84 events to Supabase. Users/interactions are synthetic reference data.

---

## Step 6: Start the Backend

Open **Terminal 1**:
```powershell
cd campusconnect\backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ FastAPI docs: http://localhost:8000/docs

---

## Step 7: Start the Frontend

Open **Terminal 2**:
```powershell
cd campusconnect\frontend
npm run dev
```

✅ App: http://localhost:5173

---

## Review 2 Demo Checklist

| Feature | URL | Notes |
|---------|-----|-------|
| Landing Page | `/` | Features overview |
| Register | `/register` | Create new account |
| Survey | `/survey` | Select interests |
| Dashboard | `/dashboard` | AI recommendations + stats |
| General Events | `/events` | Browse + filter + save |
| Recommendations | `/recommendations` | AI-powered, with explanation |
| Dataset Demo | `/dataset` | Charts for faculty review |
| SIL Dashboard | `/sil` | After college verification |
| College Events | `/events/college` | After college verification |
| Organizer QR | `/organizer` | Generate QR codes |

### Showing Dataset to Faculty
Direct faculty to: **http://localhost:5173/dataset**

This page shows (without login required):
- Total events, users, interactions, attendance counts
- Events by category bar chart
- Interaction type weights bar chart  
- Attendance verification pie chart
- General vs College events pie chart
- AI algorithm explanation

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────┐
│   React Frontend    │────▶│    FastAPI Backend    │
│   (Vite + TW)       │     │   (Recommendations,   │
│   localhost:5173    │     │    QR Attendance,      │
│                     │     │    SIL tracking)       │
└────────┬────────────┘     └──────────┬───────────┘
         │                             │
         │                             │ service_role key
         ▼                             ▼
┌─────────────────────────────────────────────────┐
│              Supabase                            │
│  PostgreSQL + Auth + Storage (Row Level Security)│
└─────────────────────────────────────────────────┘
```

**Frontend uses**: Supabase anon key (RLS enforced)  
**Backend uses**: Supabase service role key (bypasses RLS for admin ops)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `ValidationError: supabase_url missing` | Add credentials to `backend/.env` |
| `Cannot find module '@supabase/supabase-js'` | Run `npm install` in `frontend/` |
| `sentence-transformers not found` | Run `pip install sentence-transformers` in backend venv |
| Recommendations not loading | Check backend is running on port 8000 |
| CORS error in browser | Check `VITE_BACKEND_URL` in frontend `.env` |
