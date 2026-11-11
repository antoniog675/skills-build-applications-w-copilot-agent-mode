# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use one shared, typed capability view for API loading, empty, error, and success states; keep each page responsible for rendering its own response shape.
- Logic tier decision: Keep request validation and persistence behavior in explicit service functions, return deliberate 4xx errors for invalid or unknown resources, and leave routes as thin response adapters.
- Data tier decision: Express required fields, defaults, and numeric bounds in Mongoose schemas so invalid records are rejected consistently.
- Activity tracking approach: Validate both existing ObjectId references and activity input, compute points from submitted minutes, and set the occurrence time on creation.
- Team management approach: Require a non-empty name and mascot, default members to an empty list, and validate supplied members before team creation.
- Leaderboard approach: Sum points by team, include teams with no recorded activity at zero points, and assign deterministic 1-based ranks.
- Workout suggestions approach: Find the requested user by email, prefer a matching fitness goal and otherwise derive focus from recent activity, and return matching workouts with a reason; unknown users receive 404.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` (baseline: 4 schema-validation tests fail; after implementation: 5/5 pass. Seed test protects existing data and checks idempotency).
- API command: `npm run test:api --prefix octofit-tracker/backend` (baseline: 4/4 fail across activity/team creation, leaderboard, and suggestion reasons; after implementation: 4/4 pass).
- Frontend command: `npm test --prefix octofit-tracker/frontend` (baseline: 15/15 fail on placeholder pages; after implementation: 15/15 pass, including loading, empty, and error states).
- Backend build command: `npm run build --prefix octofit-tracker/backend` (checks TypeScript compilation; passed).
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` (checks TypeScript compilation and the Vite production build; passed).
