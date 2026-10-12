# Implementation status

## Included
- React/Vite student dashboard served by the Express API as a single deployable service (Docker image, Render blueprint, Docker Compose).
- Catalogue of 21 real central, state and foundation scholarships with official source links, verification labels, deadline provenance and integrity tests ([DATASET.md](DATASET.md)).
- Deterministic eligibility engine: state, level, field, year of study, gender, social category, disability, income (category-specific), marks, and "confirm before applying" conditions.
- Resumable agent runs with option-based follow-up questions, checklists that include scheme-specific conditions, an audit trail and a draft-approval boundary.
- Per-browser data ownership: records are stored with a hashed client key and every lookup is filtered by it.
- Gemini explanations, OCR and embeddings, all with timeouts and deterministic fallbacks. The model cannot change a rule result or raise its confidence.
- Admin pipeline: official-source ingestion into Pinecone, read-only Playwright inspection, Inngest/SMTP notifications, timing-safe admin token check.
- Helmet CSP, API rate limiting with proxy awareness, JSON 404s, graceful shutdown, MongoDB reconnect retries.
- Node test suite: rule engine, dataset integrity, chunking.

## Configuration-dependent
- Persistence requires `MONGODB_URI`. Without it, data lives in memory until restart.
- Gemini features require `GEMINI_API_KEY`. Retrieval requires a 768-dimension Pinecone index.
- Admin endpoints require `ADMIN_API_TOKEN`. Email requires SMTP plus a running Inngest function.
- Playwright inspection requires installed browser binaries (not included in the Docker image).

## Known limits
- No user accounts: a workspace is tied to the browser that created it.
- Catalogue facts are dated (reviewed 13 Oct 2026) and must be re-verified every academic year; "reported" deadlines should be confirmed on the official portal.
- Ingested source text is retrieved as evidence; it is not automatically converted into catalogue rules.
- The app never submits applications to third-party portals.
