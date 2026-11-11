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
| `FRONTEND_ORIGIN` | Yes | Exact origin allowed by CORS, e.g. `http://localhost:5173` |
| `JWT_SECRET` | **Yes** | Long random string signing session tokens — the server refuses to start without it |
| `SESSION_TIMEOUT_SECONDS` | No (default 3600) | JWT expiry / inactivity timeout (AUTH-06) |
| `SESSION_REFRESH_AFTER_SECONDS` | No (default 300) | How often an active session's token is renewed (sliding session) |
| `DEFAULT_SCORING_WEIGHTS` | No | JSON fallback weights (must sum to 1), used only when no `scoring.json` exists |
| `DATA_DIR` | No (default `./data`) | Where the JSON data files live |

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

## 5. Resetting demonstration state

- **Full reset (fresh install):** re-run `npm run seed` from `backend/` — this overwrites every
  JSON file with the baseline demo dataset (3 projects, 8 materials, 4 users).
- **In-app reset (no restart needed):** sign in as `admin@polyaxis-demo.com` → **Admin Panel →
  Reset Scenarios**, either per-project or batch "Reset All Demo Scenarios" (ADMIN-03/04).

## 6. Security checklist before any real deployment

This is a Phase 1 prototype (§2.2 — production-scale cloud deployment and enterprise security
architecture are explicitly out of scope), but at minimum:

- [ ] Replace `JWT_SECRET` with a freshly generated, secret-manager-stored value
- [ ] Set `FRONTEND_ORIGIN` to the real deployed frontend origin (not `*`)
- [ ] Serve over HTTPS (terminate TLS at a reverse proxy / load balancer)
- [ ] Change the seeded demo account passwords or remove the demo accounts entirely
- [ ] Confirm `backend/data/` is on persistent, backed-up storage (or migrate to PostgreSQL — see
      `docs/DataStructure.md` §"Phase 2 migration path")

## 7. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Server exits immediately with "JWT_SECRET is not configured" | `backend/.env` missing or `JWT_SECRET` unset |
| Frontend shows network errors for every request | Backend not running on the port `vite.config.js` proxies to, or `FRONTEND_ORIGIN` mismatch causing CORS rejection |
| Login always fails | Data files not seeded — run `npm run seed` from `backend/` |
| "Administrator access required" for a demo account you expect to work | Confirm you're signed in as `admin@polyaxis-demo.com`, not a Technical User account |
