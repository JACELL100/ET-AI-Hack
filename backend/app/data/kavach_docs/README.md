# KAVACH Local Knowledge Base

Drop `.txt` or `.md` files here and they will be picked up automatically
during re-indexing when `FASTAPI_DEBUG=true` (local development).

## File naming convention

Use a descriptive filename — it becomes the document title:

    digital_arrest_guide.txt
    rbi_ficn_advisory.md
    upi_safety_tips.txt

## Format

Plain text or Markdown. Each file is treated as one document chunk.
For best retrieval quality keep each file focused on a single topic
and under ~1000 words.

## How to re-index

Option 1 — API (while backend is running):
    POST http://localhost:8000/api/v1/kavach/ingest

Option 2 — CLI:
    cd backend
    .venv\Scripts\python -m app.services.kavach_ingest --no-web

## Production behaviour

When FASTAPI_DEBUG=false this folder is ignored entirely — only the
built-in corpus (kavach_scraper.py) is used, so there is nothing to
configure or break in deployment.
