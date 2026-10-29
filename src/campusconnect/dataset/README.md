# CampusConnect Dataset Documentation

> **IMPORTANT — Academic Honesty Notice**
>
> This is a **synthetic (artificially generated) dataset** created specifically for prototype development.
> It does **NOT** represent real student data from KL University or any other institution.
> Real interaction data will be collected after the application is deployed.

---

## Why Does This Dataset Exist?

The CampusConnect platform is a new application that has not yet been deployed to real users.
Without deployment, there is no real user interaction history available.

To demonstrate the AI recommendation engine during Review 2, we created a realistic synthetic dataset
that simulates the kinds of events, users, and interactions the platform would accumulate after deployment.

This is standard practice in academic machine learning projects — real-world data collection begins
after the system is deployed and users start interacting with it.

---

## Dataset Summary

| File | Records | Description |
|------|---------|-------------|
| `events.csv` | 84 | Synthetic campus events (60 general + 24 college) |
| `users.csv` | 50 | Synthetic user profiles with diverse interests |
| `interactions.csv` | 500 | Simulated user-event interactions |
| `attendance.csv` | 200 | Simulated attendance records |

---

## File Descriptions

### events.csv

Contains event metadata for the recommendation engine.

| Column | Type | Description |
|--------|------|-------------|
| `event_id` | UUID | Unique event identifier |
| `title` | String | Event title |
| `description` | String | Detailed event description (used for AI embeddings) |
| `category` | String | Event category (AI, ML, Web Dev, Sports, etc.) |
| `tags` | String (pipe-separated) | Specific topic tags |
| `event_type` | Enum | `general` or `college` |
| `location` | String | Venue name and address |
| `city` | String | City where event is held |
| `date` | Date (YYYY-MM-DD) | Event date |
| `start_time` | Time | Event start time |
| `end_time` | Time | Event end time |
| `mode` | Enum | `online`, `offline`, or `hybrid` |
| `college_scope` | Boolean | True = college-only event |
| `college_id` | String | `KLU` for KL University events, empty for general |
| `expected_participants` | Integer | Expected number of attendees |
| `capacity` | Integer | Maximum room/venue capacity |
| `organizer` | String | Organizer name |

**Categories covered**: Artificial Intelligence, Machine Learning, Data Science, Python,
Web Development, App Development, Cybersecurity, Cloud Computing, Programming, Hackathon,
Coding Competition, Entrepreneurship, Startup, Career, Placement, Robotics, IoT,
Cultural, Sports, Gaming, Photography, Networking, Workshop, Seminar

---

### users.csv

Synthetic user profiles representing diverse student interests.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Unique user identifier |
| `name` | String | Synthetic student name |
| `location` | String | City of residence |
| `college_id` | String | `KLU` if verified college user |
| `college_verified` | Boolean | Whether college email is verified |
| `interests` | String (pipe-separated) | User interest tags |
| `preferred_mode` | Enum | `online`, `offline`, or `both` |

**Interest profiles in the dataset**:
- User Type 1: AI, Machine Learning, Python, Data Science
- User Type 2: Web Development, App Development, JavaScript
- User Type 3: Cybersecurity, Networking, Cloud Computing
- User Type 4: Entrepreneurship, Startups, Career
- User Type 5: Robotics, IoT, Embedded Systems
- User Type 6: Gaming, Esports, Game Development
- User Type 7: Cultural, Music, Photography, Sports

---

### interactions.csv

Simulates how users interact with events over time.
Used by the recommendation engine to learn user preferences.

| Column | Type | Description |
|--------|------|-------------|
| `interaction_id` | UUID | Unique interaction identifier |
| `user_id` | UUID | User who interacted |
| `event_id` | UUID | Event interacted with |
| `viewed` | Boolean | User viewed the event |
| `saved` | Boolean | User bookmarked the event |
| `registered` | Boolean | User registered for the event |
| `attended` | Boolean | User attended the event |
| `rating` | Integer (1-5) | User rating (if provided) |
| `interaction_date` | Date | When the interaction occurred |

**Interaction Weights** (used by recommendation engine):

| Interaction | Weight | Reasoning |
|-------------|--------|-----------|
| Viewed | 1 | Weak signal — might be accidental |
| Saved | 3 | Moderate interest |
| Registered | 5 | Strong intent |
| Attended | 8 | Confirmed interest |
| Rated (4+) | 10 | Explicit positive feedback |

**Realistic patterns**: Users interested in AI have more interactions with AI events.
Users interested in sports have more interactions with sports events. This ensures
the recommendation engine demonstrates meaningful personalization.

---

### attendance.csv

Simulates two-step QR attendance verification results.

| Column | Type | Description |
|--------|------|-------------|
| `attendance_id` | UUID | Unique attendance record |
| `user_id` | UUID | Attending student |
| `event_id` | UUID | Event attended |
| `entry_time` | DateTime | When student scanned Entry QR |
| `exit_time` | DateTime | When student scanned Exit QR |
| `entry_verified` | Boolean | Entry QR successfully scanned |
| `exit_verified` | Boolean | Exit QR successfully scanned |
| `attendance_verified` | Boolean | Full attendance confirmed |
| `sil_credit` | Boolean | SIL credit awarded |

**Attendance scenarios included**:
- **Fully verified** (80%): entry_verified=True, exit_verified=True, sil_credit=True
- **Incomplete** (20%): entry_verified=True, exit_verified=False, sil_credit=False
  (student left without scanning exit QR)

---

## How the Recommendation System Uses This Dataset

### For New Users (Cold Start)
1. User completes the preference survey
2. Survey interests are converted to embeddings using `all-MiniLM-L6-v2`
3. Event titles + descriptions + categories + tags are also embedded
4. Cosine similarity ranks events by relevance to user interests
5. Top events are recommended with an explanation

### For Existing Users (Warm Start)
1. All user interactions are fetched and weighted
2. A weighted mean of attended/registered event embeddings creates a "user profile vector"
3. This is blended 70% history + 30% survey preferences
4. Cosine similarity ranks upcoming events
5. Location and college boosts are applied

---

## Synthetic Data Limitations

1. **No real privacy data**: All names, emails, and personal details are fictional
2. **Simulated interaction patterns**: Real users may behave differently
3. **Limited temporal dynamics**: Real data would show seasonal trends
4. **No feedback loops**: Real deployment would improve recommendations over time

---

## Future Plan

After deployment, real interaction data will be collected and can be used to:
1. Retrain or fine-tune the recommendation model
2. Replace synthetic interactions with real user behavior
3. Enable collaborative filtering (user-user and item-item similarity)
4. Build a feedback loop for continuous improvement

---

*Dataset generated: September 2025*
*For: CampusConnect — Review 2 Prototype*
*Type: Synthetic / Project-Generated*
