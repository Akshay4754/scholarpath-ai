# Setup checklist

1. Install Node.js 20+.
2. Get a MongoDB database: a local server (`mongodb://127.0.0.1:27017/scholarpath`) or MongoDB Atlas. With Atlas, replace `<db_password>` in the copied string with the real password and add a database name, e.g. `...mongodb.net/scholarpath?...`.
3. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`. Generate `ADMIN_API_TOKEN` with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Optional AI: set `GEMINI_API_KEY` (default model `gemini-3.8-flash`).
5. Optional retrieval: create a Pinecone **dense index with 768 dimensions** named `scholarpath-index` (or set `PINECONE_INDEX_NAME`) and set `PINECONE_API_KEY`.
6. Optional email: fill the `SMTP_*` values and run an Inngest dev server, or deploy with `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY`.
7. `cd backend && npm install && npm run dev`. Check `http://localhost:4000/api/health` shows `"database":"connected"`.
8. `cd frontend && npm install && npm run dev`, then open `http://localhost:5173`.
9. Optional: `cd backend && npx playwright install chromium` for admin page inspection.
10. Run `cd backend && npm test` before every deploy.
11. Index official sources with `POST /api/admin/sources/ingest` (header `x-admin-token`), using only URLs you have verified as official. Pass the matching catalogue `scholarshipId` so evidence attaches to the right scheme.
12. Deploy using [DEPLOYMENT.md](DEPLOYMENT.md). Re-verify the catalogue each academic year ([docs/DATASET.md](docs/DATASET.md)).
