"""
Interaction weights configuration.

All weight values are defined here in one place.
Change these values to tune the recommendation system.
Do NOT scatter these values across the codebase.
"""

INTERACTION_WEIGHTS: dict[str, int] = {
    "viewed":           1,
    "saved":            3,
    "registered":       5,
    "attended":         8,
    "positive_rating":  10,   # rating >= 4 out of 5
}

# Blend weights for experienced users (>= MIN_HISTORY_EVENTS interactions)
MIN_HISTORY_EVENTS = 5          # threshold to shift from cold-start to warm-start
COLD_START_BLEND   = 0.3        # survey weight when history exists
HISTORY_BLEND      = 0.7        # interaction history weight

# Score boost for events in the user's preferred city
LOCATION_BOOST = 0.05

# Score boost for college events when user is verified for that college
COLLEGE_BOOST = 0.08

# Penalty for already-registered events (so they don't dominate recs)
REGISTERED_PENALTY = 0.5
