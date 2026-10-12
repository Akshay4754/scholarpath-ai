# Agent workflow lifecycle

## States

- `investigating`: checking the current profile against the selected catalogue entry.
- `waiting_for_user`: one or more required facts are unknown; the agent asks one targeted question at a time.
- `ready_for_review`: no required fact is unknown and a checklist has been prepared. This is not a final eligibility determination.
- `needs_attention`: a deterministic rule does not match; the system does not prepare the application as eligible.
- `completed`: the user has approved the draft for export. No third-party portal submission occurs.

## Decision loop

1. Start an agent run with a profile snapshot and a scholarship ID.
2. Retrieve configured evidence through the Pinecone adapter. Every catalogue record carries its official source, verification level and review date.
3. Apply deterministic checks to state, education level, field of study, year of study, gender, social category, disability, income and marks — only the criteria the scheme actually restricts.
4. If a required field is unknown, ask the corresponding follow-up question (with a fixed list of answers where one exists).
5. Store the answer and rerun the assessment.
6. When no required fact is unknown and no rule fails, create a checklist: required documents, each scheme-specific condition to confirm, an official-rules check and a draft review.
7. Require the student to review each required checklist item and approve the draft for export.
8. Record all state transitions as activity events.

## Persistence

With MongoDB connected, `AgentRun` documents persist profile snapshots, current state, questions, responses, assessment output, checklist state, and events. Without MongoDB, runs are kept in a process-local `Map` and lost when the backend restarts. Runs are scoped to the browser’s client key in both modes. The frontend stores the active run ID in local storage to restore the run on a browser refresh.

## Guardrails

- Catalogue records are dated screening data; the scheme provider’s decision is final and students confirm on the official portal.
- RAG is evidence retrieval, not a source of truth by itself. Rule conditions should be validated deterministically and linked to dated official sources before real-world use.
- Missing or conflicting facts must result in a question or `needs_review`, not a guessed answer.
- Draft approval means approval for export only. It never means submission to a third-party portal.
- Workspaces are scoped per browser, not per account. Add authentication before storing data that must survive a lost browser profile.
