# PolyAxis Phase 1 — Setup & Deployment Guide

## 1. Prerequisites

- Node.js ≥ 18 and npm
- No database server required (Phase 1 uses JSON file storage)

## 2. Local development

```bash
# Backend
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET to a long random value
npm run seed                # populate backend/data/*.json with baseline demo data
npm run dev                  # http://localhost:4000 (nodemon, auto-reload)

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173 — proxies /api/* to :4000
```

Sign in at `http://localhost:5173/login` with any [demo account](./DemoOperationGuide.md#demo-accounts).

## 3. Environment variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default 4000) | HTTP port the API listens on |
| `NODE_ENV` | No | `development` or `production` |
| `FRONTEND_ORIGIN` | Locally | Exact origin allowed by CORS, e.g. `http://localhost:5173`. On Render it defaults to the service's own `RENDER_EXTERNAL_URL` (the API serves the frontend, so it is same-origin) |
| `JWT_SECRET` | **Yes** | Long random string signing session tokens — the server refuses to start without it |
| `SESSION_TIMEOUT_SECONDS` | No (default 3600) | JWT expiry / inactivity timeout (AUTH-06) |
| `SESSION_REFRESH_AFTER_SECONDS` | No (default 300) | How often an active session's token is renewed (sliding session) |
| `DEFAULT_SCORING_WEIGHTS` | No | JSON fallback weights (must sum to 1), used only when no `scoring.json` exists |
| `DATA_DIR` | No (default `./data`) | Where the JSON data files live. On Render, point it at the persistent disk (`/var/data`) |
| `SEED_ADMIN_PASSWORD` | No (default `Admin2026!`) | Password given to `admin@polyaxis-demo.com` when the data is first seeded. **Set this on any public deployment** |
| `SEED_DEMO_PASSWORD` | No (default `Demo2026!`) | Password given to the three demo Technical User accounts when first seeded |

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Leave unset in development (Vite proxy handles it); set to the deployed API's `/api` URL in production if the frontend and backend are on different origins |

## 4. Production build — single deployable unit

The backend serves the built frontend as static files from the same Express process (§9 of the
requirements — "single deployable unit"):

```bash
cd frontend
npm install
npm run build            # writes frontend/dist

cd ../backend
npm install
npm run seed               # first run only, or after a full reset
NODE_ENV=production npm start   # serves both the API and frontend/dist on $PORT
```

Any request not starting with `/api` is served `frontend/dist/index.html` (client-side routing).

## 5. Deploying to Render (frontend + backend)

PolyAxis deploys to Render as **one web service** that runs the Express API *and* serves the built React
app: a single public URL, no CORS setup, no cross-service variables. The service runs on Render's
**free plan** by default.

There are two equivalent ways to create it:

| Way | When to use it |
|---|---|
| **Blueprint** — [`render.yaml`](../render.yaml) in the repo root | Easiest from the dashboard: **New → Blueprint**, pick the repo, Render reads the file |
| **Render API** — create the web service directly with an API key | Scriptable; does not need `render.yaml` at all |

Either way the result is the same web service. A Blueprint is just a file that *describes* services; the
thing that runs is a normal web service.

### Steps (Blueprint)

1. Push the repository to GitHub (`viz-83/POLYAXIS`).
2. In the Render dashboard choose **New → Blueprint**, connect the repository and select `main`.
3. When prompted, enter **`SEED_DEMO_PASSWORD`** — the password for the three demo user accounts
   (Alex, Sarah, James). `JWT_SECRET` and `SEED_ADMIN_PASSWORD` are generated for you.
4. Click **Apply**. Render builds (frontend build, then backend install), starts the service and waits for
   `/api/health` to return 200. The first deploy takes a few minutes.
5. Open the `https://polyaxis-….onrender.com` URL and read the generated admin password in the service's
   **Environment** tab (`SEED_ADMIN_PASSWORD`); sign in as `admin@polyaxis-demo.com`.

Every push to `main` redeploys automatically (`autoDeploy: true`).

### What the service is configured with

| Item | Value | Why |
|---|---|---|
| Plan | `free` | No cost; see the trade-offs below |
| Build | `npm --prefix frontend ci --include=dev && npm --prefix frontend run build && npm --prefix backend ci --omit=dev` | `--include=dev` because Vite and Tailwind are devDependencies and `NODE_ENV=production` would otherwise skip them |
| Start | `npm --prefix backend start` | Runs `scripts/ensure-seed.js`, then `server.js` |
| Health check | `/api/health` | Render only routes traffic once it returns 200 |
| `JWT_SECRET` | generated | The server will not start without it |
| `SEED_ADMIN_PASSWORD` | generated | A public instance must not ship the published admin password |
| `SEED_DEMO_PASSWORD` | you choose it | Demo users need a password you can share with reviewers |

### Free plan: what to expect

- **Cold starts.** The service spins down after about 15 minutes without traffic. The next request wakes it
  and takes roughly a minute; later requests are normal speed.
- **Data does not persist.** The free filesystem is ephemeral and Phase 1 stores JSON files, so everything
  is wiped when the service restarts, spins down or redeploys. This is fine for demonstrations: the
  baseline demo projects are re-seeded automatically on every boot (`ensure-seed.js` seeds whenever the
  data directory is empty), using `SEED_ADMIN_PASSWORD` / `SEED_DEMO_PASSWORD`. **Projects, trial
  results and anything else users create are lost.**
- **No shell and no disks** on the free plan.

### Keeping data (paid plans)

Change `plan:` to `starter`, uncomment the `disk:` block and the `DATA_DIR` variable in `render.yaml`
(`/var/data`, 1 GB). `ensure-seed.js` only seeds when no users exist, so a disk is never overwritten, and
the `SEED_*_PASSWORD` values then apply at the *first* seeding only. A service with a disk runs a single
instance: the JSON data layer is not safe for multiple writers, so do not scale it out — migrate to
PostgreSQL first (see `docs/DataStructure.md`). To wipe a paid instance, open a Render **Shell** and run
`npm --prefix backend run seed`, then restart.

### Other limitations

- Active-session tracking (Admin → System Status) is held in memory and resets on restart. Signed-in users
  stay signed in across a restart on the same instance, because sessions are signed tokens — but on the free
  plan the data (including the users) is re-created on a cold start, so sign in again if the user ids changed.
- There is no password-change screen in Phase 1.

## 6. Resetting demonstration state

- **Full reset (fresh install):** re-run `npm run seed` from `backend/` — this overwrites every
  JSON file with the baseline demo dataset (3 projects, 8 materials, 4 users).
- **In-app reset (no restart needed):** sign in as `admin@polyaxis-demo.com` → **Admin Panel →
  Reset Scenarios**, either per-project or batch "Reset All Demo Scenarios" (ADMIN-03/04).

## 7. Security checklist before any real deployment

This is a Phase 1 prototype (§2.2 — production-scale cloud deployment and enterprise security
architecture are explicitly out of scope), but at minimum:

- [ ] Replace `JWT_SECRET` with a freshly generated, secret-manager-stored value (Render blueprint: generated for you)
- [ ] Set `FRONTEND_ORIGIN` to the real deployed frontend origin (not `*`)
- [ ] Serve over HTTPS (terminate TLS at a reverse proxy / load balancer — Render does this automatically)
- [ ] Change the seeded demo account passwords or remove the demo accounts entirely (set `SEED_ADMIN_PASSWORD` / `SEED_DEMO_PASSWORD`)
- [ ] Confirm `backend/data/` is on persistent, backed-up storage — the Render free plan is NOT (or migrate to PostgreSQL — see
      `docs/DataStructure.md` §"Phase 2 migration path")

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Server exits immediately with "JWT_SECRET is not configured" | `backend/.env` missing or `JWT_SECRET` unset |
| Frontend shows network errors for every request | Backend not running on the port `vite.config.js` proxies to, or `FRONTEND_ORIGIN` mismatch causing CORS rejection |
| Login always fails | Data files not seeded — run `npm run seed` from `backend/` |
| Render deploy fails during the frontend build with "vite: not found" | The install skipped devDependencies — the build command must use `npm ci --include=dev` for `frontend` |
| Render service restarts in a loop right after deploy | `JWT_SECRET` missing, or (paid plans) `DATA_DIR` is not writable because the disk is not attached or the mount path is wrong |
| Projects disappear after a deploy, restart or idle period on Render | Expected on the free plan (ephemeral filesystem) — see "Keeping data (paid plans)" |
| First request to the Render URL takes about a minute | Free-plan cold start after 15 minutes idle |
| "Administrator access required" for a demo account you expect to work | Confirm you're signed in as `admin@polyaxis-demo.com`, not a Technical User account |
