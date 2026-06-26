# Predictor

A prediction game for the 2026 FIFA World Cup. Pick how every group finishes, choose which third-placed sides advance, then call the winner of every knockout match all the way to the final. Compete in private leagues with friends and track each other's scores as the tournament unfolds.

Built with React, Vite, and Supabase.

---

## Features

- **Group stage predictions** — drag teams into your predicted finishing order for all 12 groups, then pick which 8 third-placed sides advance to the Round of 32
- **Knockout predictions** — pick a winner for every match across R32, R16, QF, SF, and the Final, with optional score, extra time, and penalty predictions
- **Deadline locking** — predictions lock automatically at kick-off; a live countdown is shown while predictions are open
- **Results & scoring** — once a round is complete, points are displayed with a per-group breakdown and bonus explanations
- **Private leagues** — create a league and share an invite code; friends join with the code and compete on a live leaderboard
- **Member profiles** — click any league member to see their predictions and points breakdown
- **Google OAuth + email/password auth** — sign in either way; password reset via email

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, React Router 7, Vite 8 |
| Backend / DB | Supabase (Postgres, Auth, PostgREST) |
| Styling | Plain CSS with CSS custom properties |
| Auth | Supabase Auth — email/password + Google OAuth |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── lib/
│   ├── supabaseClient.js      # Supabase client initialisation
│   ├── deadline.js            # Prediction lock and round-complete timestamps
│   └── flags.js               # Team name → emoji flag map
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── UpdatePassword.jsx
│   ├── Dashboard.jsx
│   ├── Header.jsx
│   ├── PredictionsMenu.jsx    # Stage selector — unlocks rounds as tournament progresses
│   ├── GroupStagePredictions.jsx
│   ├── GroupStageResults.jsx  # Scored results view with points breakdown
│   ├── ViewGroupStagePredictions.jsx  # Read-only predictions view (pre-results)
│   ├── KnockoutPredictions.jsx        # Reusable for all knockout rounds via :round param
│   ├── Leagues.jsx
│   ├── LeagueDetail.jsx       # Leaderboard for a single league
│   ├── MemberMenu.jsx         # Per-member nav (group stage / knockout)
│   ├── CreateLeague.jsx
│   ├── JoinLeague.jsx
│   └── styles/                # Co-located CSS per page
├── App.jsx                    # Route definitions
└── main.jsx
```

---

## Routes

| Path | Page |
|---|---|
| `/` | Login |
| `/register` | Register |
| `/login` | Login |
| `/forgotPassword` | Forgot password |
| `/update-password` | Set new password (from reset email) |
| `/dashboard` | Dashboard |
| `/predictionsMenu` | Prediction stage selector |
| `/GroupStagePredictions` | Make / edit group stage predictions |
| `/predictions/groupstage/:userId` | View a user's group stage predictions |
| `/predictions/knockout/:round` | Knockout predictions (`R32` `R16` `QF` `SF` `F`) |
| `/leagues` | Your leagues |
| `/leagues/create` | Create a league |
| `/leagues/join` | Join a league with invite code |
| `/leagues/:leagueId` | League leaderboard |
| `/leagues/:leagueId/members/:userId` | Member profile menu |
| `/leagues/:leagueId/members/:userId/groupstage` | Member's group stage results |

---

## Database Schema

### `profiles`
Extends `auth.users`. Created automatically on sign-up via a Supabase trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | FK → `auth.users` |
| `username` | text | Unique |
| `avatar_url` | text | |

### `group_stage_predictions`
One row per team per user (48 rows per user for a complete submission).

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → `profiles` |
| `team_id` | text | Team name e.g. `'England'` |
| `group_id` | text | `'A'` through `'L'` |
| `predicted_position` | integer | 1–4 |
| `is_third_place_progressor` | boolean | Only meaningful when `predicted_position = 3` |
| `points_awarded` | bigint | Populated by backend scoring; bonuses stored on the position-1 row |

### `group_stage_positions`
Actual results — populated by an admin once the group stage is complete. No foreign key to predictions; joined in the frontend by `team_id`.

| Column | Type | Notes |
|---|---|---|
| `team_id` | text | PK |
| `group_id` | text | |
| `position` | integer | 1–4; null until group is played |
| `is_third_place_progressor` | boolean | |

### `knockout_matches`
Populated by an admin before each round.

| Column | Type | Notes |
|---|---|---|
| `match_id` | text | PK e.g. `'R32_1'` |
| `round` | text | `R32` `R16` `QF` `SF` `F` |
| `home_team` / `away_team` | text | |
| `winner` | text | Null until played |
| `home_goals` / `away_goals` | integer | |
| `extra_time` / `penalties` | boolean | |
| `scheduled_at` | timestamptz | |

### `knockout_predictions`
One row per match per user.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → `profiles` |
| `match_id` | text | |
| `round` | text | |
| `predicted_winner` | text | |
| `predicted_home_goals` / `predicted_away_goals` | integer | Optional |
| `predicted_extra_time` / `predicted_penalties` | boolean | |
| `points_awarded` | integer | Populated by backend scoring |

### `leagues` / `league_members`
`leagues` stores the league name, owner, and a randomly generated 8-character `invite_code`. `league_members` is the join table with a `total_points` column that is updated by the backend scoring process.

---

## Scoring

### Group stage
Points are pre-calculated by the backend and stored in `points_awarded` on each prediction row. Bonuses are stored on the `predicted_position = 1` row for the group to avoid double-counting.

| Achievement | Points |
|---|---|
| Correct position (per team) | +3 |
| 3rd place + correct progressor pick | +2 bonus (on top of the +3) |
| Top 2 teams identified, wrong order | +3 bonus |
| Top 2 teams identified, correct order | +5 bonus |
| Entire group in correct order | +10 bonus |

The bonus tiers are mutually exclusive. Maximum per group: 24 pts.

To derive a human-readable bonus from the frontend, read `points_awarded` on the position-1 row:
- `13` → perfect group (+10 bonus)
- `8` → top 2 in correct order (+5 bonus)
- `6` → top 2 identified, wrong order (+3 bonus)
- `3` → position correct, no bonus

### Knockout rounds
Points are stored in `points_awarded` on each `knockout_predictions` row and calculated by the backend once match results are entered.

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project

### Environment variables
Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install and run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Supabase setup
- Enable email/password auth and Google OAuth in the Supabase dashboard
- Set the redirect URL for Google OAuth to `http://localhost:5173` (dev) and your production domain
- Set the redirect URL for password reset emails to `http://localhost:5173/update-password`
- Create a trigger on `auth.users` to insert a row into `public.profiles` on sign-up, copying `raw_user_meta_data->>'username'` into the `username` column

---

## Deployment

The project is configured for Vercel. The `vercel.json` rewrites all non-asset paths to `/` so client-side routing works correctly.

```json
{
  "rewrites": [
    { "source": "/:path((?!.*\\.).*)", "destination": "/" }
  ]
}
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your Vercel project settings.
