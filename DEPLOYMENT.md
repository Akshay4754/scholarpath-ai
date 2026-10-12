# Deploying ScholarPath AI

ScholarPath ships as **one service**: the Express API serves the built React app, so the browser talks to a single origin and no CORS setup is needed. MongoDB is the only required external dependency.

## Option A — Render + MongoDB Atlas (recommended)

1. **Database.** In MongoDB Atlas, create a cluster (the free M0 tier works), a database user, and a network access rule (`0.0.0.0/0` for Render's free tier, which has no static IPs). Copy the connection string and:
   - replace `<db_password>` with the user's real password (URL-encode characters such as `@`, `:` or `/`);
   - add a database name before the `?`, e.g. `...mongodb.net/scholarpath?retryWrites=true&w=majority`.
2. **Push** the `scholarpath-ai` folder to a GitHub repository (it must be the repository root, because `render.yaml` and the `Dockerfile` live there).
3. In Render choose **New → Blueprint**, select the repository, and fill in the prompted secrets:
   - `MONGODB_URI` — the Atlas string from step 1 (required)
   - `GEMINI_API_KEY`, `PINECONE_API_KEY` — optional
   - `ADMIN_API_TOKEN` is generated automatically.
4. When the deploy finishes, open `https://<your-service>.onrender.com/api/health`. You want `"database":"connected"`.

Render's free instances sleep when idle, so the first request after a pause takes a little longer.

## Option B — Docker Compose on your own server

Runs the app plus MongoDB with a persistent volume:

```bash
cd scholarpath-ai
export ADMIN_API_TOKEN=$(openssl rand -hex 32)
export GEMINI_API_KEY=...        # optional
docker compose up -d --build
```

Open `http://<server>:4000`. Put a TLS-terminating reverse proxy (Caddy, Nginx, Traefik) in front, and set `TRUST_PROXY=1` so rate limiting sees real client IPs.

To build and run the image on its own:

```bash
docker build -t scholarpath-ai .
docker run -p 4000:4000 -e MONGODB_URI="mongodb+srv://..." -e ADMIN_API_TOKEN="..." scholarpath-ai
```

## Option C — Any Node host without Docker

From the `scholarpath-ai` folder: build command `npm run build`, start command `npm start`, Node 20 or newer. Set `NODE_ENV=production` and the variables below in the host's dashboard.

## Separate frontend hosting (optional)

To host the frontend on Vercel or Netlify and the API elsewhere:

- build the frontend with `VITE_API_BASE_URL=https://<api-host>/api`;
- set `CLIENT_ORIGIN=https://<frontend-host>` on the API.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes, for real use | Persists profiles, applications and agent runs. Without it, data lives in memory and is lost on restart. The server retries the connection every 15 s. |
| `NODE_ENV` | Yes | `production` hides error details and defaults `TRUST_PROXY` to 1. |
| `ADMIN_API_TOKEN` | For admin APIs | Protects `/api/admin/*` (source ingestion, page inspection, notifications). Admin endpoints are disabled while it is blank. |
| `PORT` | No | Defaults to 4000. Most platforms set it for you. |
| `TRUST_PROXY` | Behind a proxy | Number of reverse proxies in front of the app. |
| `CLIENT_ORIGIN` | Split hosting only | Comma-separated origins allowed to call the API. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | No | Plain-language explanations, OCR and embeddings. The default model is `gemini-3.8-flash`. Eligibility decisions never depend on it. |
| `GEMINI_TIMEOUT_MS` | No | Per-call timeout (default 25000). On timeout the rule-based explanation is used. |
| `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_NAMESPACE` | No | Official-document retrieval. The index must be dense with 768 dimensions (default name `scholarpath-index`). |
| `SMTP_*`, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` | No | Email notifications through Inngest. |

## Before you share the link

- **Data ownership.** There are no user accounts. Each browser gets a random key, and the server stores and filters records by its hash, so one visitor cannot read another's data. A visitor who clears their browser storage loses access to their workspace. Add real authentication before storing data you could not afford to lose or expose.
- **Uploads.** Documents are written to a temporary folder, processed and deleted immediately. When Gemini is configured, scans and images are sent to Google for OCR. Ask students to mask Aadhaar numbers.
- **Catalogue freshness.** Re-verify the scholarship data every academic year — see [docs/DATASET.md](docs/DATASET.md).
- **No auto-submission.** The app never submits applications to third-party portals; students apply on the official sites.
- Check `/api/health` after each deploy, and keep `ADMIN_API_TOKEN` secret.
