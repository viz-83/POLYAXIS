# PolyAxis — Phase 1 Prototype

An intelligent decision-support platform for flexible-packaging manufacturers transitioning from
non-recyclable multi-material laminates to recyclable mono-material structures. The core of the
prototype is the **Compliance-Constrained Trial Design Engine** — a rule-based optimisation engine
that ranks candidate physical trials by expected information gain, cost, feasibility, uncertainty
reduction, and regulatory compliance.

Built to the [`PolyAxis_Phase1_Prototype_Requirements.md`](./PolyAxis_Phase1_Prototype_Requirements.md)
specification (v1.0, 22 August 2026).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios, Context API |
| Backend | Node.js, Express.js, JWT (jsonwebtoken), bcryptjs |
| Data | JSON file storage (`backend/data/*.json`) |
| Security | Helmet, CORS allow-list, rate limiting, input sanitisation, RBAC |

## Project structure

```
polyaxis/
├── frontend/     React application (Vite + Tailwind)
├── backend/      Express API + Compliance-Constrained Trial Design Engine
├── docs/         Architecture, data structure, optimisation logic, deployment & demo guides
└── scripts/      Entry point for the seed script (delegates to backend/scripts/seed.js)
```

## Quick start

**Prerequisites:** Node.js ≥ 18.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # then set a real JWT_SECRET
npm run seed             # writes baseline demo data to backend/data/
npm run dev               # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api to :4000)
```

Open http://localhost:5173 and sign in with one of the [demo accounts](./docs/DemoOperationGuide.md#demo-accounts).

## Production build

```bash
cd frontend && npm run build   # outputs frontend/dist
cd ../backend && npm start     # serves the API and the built frontend from one process
```

See [`docs/DeploymentGuide.md`](./docs/DeploymentGuide.md) for full details.

## Documentation

- [`docs/Architecture.md`](./docs/Architecture.md) — system architecture & module responsibilities
- [`docs/DataStructure.md`](./docs/DataStructure.md) — JSON data structures & field definitions
- [`docs/OptimisationLogic.md`](./docs/OptimisationLogic.md) — the Trial Design Engine's scoring formula
- [`docs/DeploymentGuide.md`](./docs/DeploymentGuide.md) — install, configure, run, deploy
- [`docs/DemoOperationGuide.md`](./docs/DemoOperationGuide.md) — walkthroughs for DEMO-01..05
- [`docs/RTM.md`](./docs/RTM.md) — requirements traceability matrix
- [`CLAUDE.md`](./CLAUDE.md) — codebase orientation for AI coding assistants

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Technical User | `alex.chapman@polyaxis-demo.com` | `Demo2026!` |
| Technical User | `sarah.mitchell@polyaxis-demo.com` | `Demo2026!` |
| Technical User | `james.okafor@polyaxis-demo.com` | `Demo2026!` |
| Administrator | `admin@polyaxis-demo.com` | `Admin2026!` |

## Scope note

This is a Phase 1 technical prototype using simulated/representative data (see §10.3 of the
requirements document). It is not connected to live manufacturing systems, does not process
payments, and its regulatory rule set is illustrative, not legal advice.
