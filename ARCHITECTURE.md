# ScholarPath AI — Architecture at a glance

```text
React + Vite UI (served by the API in production)
      |
      v
Express API ---- Zod validation, per-browser ownership, rate limiting
      |
      +---- MongoDB / Mongoose (profiles, applications, task state)
      |
      +---- Scholarship catalogue (21 dated, source-linked records)
      |
      +---- Deterministic eligibility rule checks
      |
      +---- Gemini (structured explanation / clarification planning)
      |
      +---- Gemini Embeddings -> Pinecone (optional official-source RAG)
      |
      +---- PDF text extraction + Gemini OCR for scans/images (unverified, human review)
```

## Why a hybrid architecture?

- Retrieval provides relevant source evidence; it does not itself determine eligibility.
- Deterministic checks evaluate hard constraints such as income thresholds and minimum marks.
- Gemini explains results and identifies follow-up questions but cannot override failed hard rules.
- MongoDB stores profiles, applications and agent runs. Without it, state lives in memory until the server restarts.
- The UI never submits an application to a third-party portal. It prepares a checklist and requires human review.
