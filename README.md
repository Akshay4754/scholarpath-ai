# ScholarPath AI — Agentic Scholarship Application Assistant

ScholarPath AI helps Indian students find scholarships, check their eligibility rule by rule against official scheme criteria, answer targeted follow-up questions, and prepare an application checklist. It is a human-in-the-loop assistant: it never submits applications to external portals.

## Highlights

- **Real scholarship catalogue.** 21 central, state and foundation schemes (CSSS, AICTE Pragati/Saksham/Swanath, post-matric SC/ST/OBC/disability, INSPIRE-SHE, NMMSS, PMSS, Reliance, Kotak Kanya, LIC GJF, Pudhumai Penn, Tamil Pudhalvan, Bihar Kanya Utthan, Maharashtra EBC, UP Dashmottar, Delhi MCM). Each record links to its official source and is dated and labelled by how it was verified. See [docs/DATASET.md](docs/DATASET.md).
- **Deterministic eligibility engine.** Checks state, level, field, year of study, gender, social category, disability, income (including category-specific limits) and marks. Missing facts become questions; conditions a profile cannot prove are listed as "confirm before applying".
- **Optional Gemini layer.** Writes the plain-language explanation, OCR for scans and embeddings. It is timeout-guarded and cannot change a rule result.
- **Resumable agent workflow.** Follow-up questions with fixed answer options, a checklist, an audit trail, and a human approval step for the draft.
- **Private per-browser workspaces.** No accounts are needed; records are scoped to a random per-browser key (see [DEPLOYMENT.md](DEPLOYMENT.md#before-you-share-the-link)).
- **Admin pipeline.** Official-source ingestion into Pinecone (HTML, text, searchable PDF), read-only Playwright page inspection, and Inngest/SMTP notifications.
- **Production setup.** Single Docker image, Render blueprint, Docker Compose with MongoDB, health checks, Helmet CSP, rate limiting, graceful shutdown.

## Run locally

Requires Node.js 20+ and, for persistence, MongoDB (a local server or Atlas).

```bash
# API (http://localhost:4000)
cd backend
cp .env.example .env      # set MONGODB_URI; other keys are optional
npm install
npm run dev

# Web app (http://localhost:5173), in a second terminal
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to the API, so no frontend configuration is needed. Health check: `GET /api/health`.

Tests: `cd backend && npm test` runs the eligibility engine tests, the dataset integrity tests (every record) and the chunking tests.

## Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md): Render + MongoDB Atlas via `render.yaml`, Docker Compose, or any Node host (`npm run build && npm start` from this folder).

## API overview

Endpoints marked 🔑 require an `x-client-key` header: a random 32–128 character `[A-Za-z0-9_-]` string the browser generates and keeps. Records are only visible to the key that created them.

- `GET /api/health` — service, database, AI and catalogue status
- `GET /api/meta` — profile option lists (states, levels, fields, categories…) used by the form and the rule engine
- `GET /api/scholarships?q=&state=&level=&field=&providerType=` — search the catalogue
- `GET /api/scholarships/:id` — one scheme
- `POST /api/eligibility/assess` — rule-by-rule assessment for `{ profile, scholarshipId }`
- `POST /api/agent/next-action` — suggest the next step for a profile/assessment/application
- 🔑 `GET /api/profile` · `POST /api/profile` — read (`profile: null` if none yet) or save this browser's profile (one per key)
- 🔑 `GET /api/applications` · `POST /api/applications` · `GET /api/applications/:id` · `PATCH /api/applications/:id/tasks/:taskId`
- 🔑 `POST /api/agent-runs` · `GET /api/agent-runs/:id` · `POST /api/agent-runs/:id/respond` · `PATCH /api/agent-runs/:id/checklist/:taskIndex` · `POST /api/agent-runs/:id/approve-draft`
- `POST /api/documents/extract` — upload a PDF/PNG/JPEG (field `document`, ≤ 8 MB); returns unverified candidate fields
- Admin (header `x-admin-token`): `GET /api/admin/sources`, `POST /api/admin/sources/ingest`, `POST /api/admin/sources/inspect-page`, `POST /api/admin/notifications/send`
- `GET/POST/PUT /api/inngest` — Inngest function endpoint

## Architecture

`Official sources → catalogue records (dated, verified) → deterministic rule engine → optional Pinecone evidence + Gemini explanation → AgentRun state machine → MongoDB → React workflow`

Agent runs move through `investigating`, `waiting_for_user`, `ready_for_review`, `needs_attention` and `completed`. See [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md).

## Limits to know

- Eligibility results are a screening aid; the scheme provider's decision is final, and students must confirm rules and deadlines on the official portal.
- The catalogue must be re-verified every academic year ([docs/DATASET.md](docs/DATASET.md#yearly-refresh)).
- There are no user accounts: losing browser storage means losing access to that workspace. Add authentication before handling data you could not afford to lose.
- Playwright page inspection needs browser binaries (`npx playwright install chromium`); the Docker image does not include them.
