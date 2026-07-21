"""KAVACH Document Ingestion Script.

Scrapes content, generates embeddings, and indexes everything into
Upstash Vector DB. Run this once (or re-run to refresh the knowledge base).

Usage:
    python -m app.services.kavach_ingest
    # or from project root:
    python backend/app/services/kavach_ingest.py
"""
from __future__ import annotations

import logging
import os
import sys
import time

# Allow running directly from the backend directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("kavach_ingest")


def run_ingestion(include_web: bool = True) -> dict:
    """Run the full scrape + embed + index pipeline."""
    from app.services.kavach_scraper import scrape_all
    from app.services.kavach_rag import get_rag

    start = time.time()

    logger.info("=" * 60)
    logger.info("KAVACH Document Ingestion Pipeline Starting")
    logger.info("=" * 60)

    # Step 1: Collect documents
    logger.info("Step 1/3: Collecting documents (web=%s)...", include_web)
    docs = scrape_all(include_web=include_web)
    logger.info("Collected %d documents total", len(docs))

    # Step 2: Initialize RAG
    logger.info("Step 2/3: Initializing RAG (loading embedding model)...")
    rag = get_rag()

    # Step 3: Index documents
    logger.info("Step 3/3: Embedding and indexing documents into Upstash Vector DB...")
    result = rag.index_documents_batch(docs)

    elapsed = time.time() - start

    logger.info("=" * 60)
    logger.info("Ingestion complete in %.1fs", elapsed)
    logger.info("  Total documents : %d", result["total"])
    logger.info("  Successfully indexed: %d", result["success"])
    logger.info("  Failed          : %d", result["failed"])
    if result["failed_ids"]:
        logger.warning("Failed IDs: %s", result["failed_ids"])
    logger.info("=" * 60)

    # Verify by getting stats
    try:
        stats = rag.get_index_stats()
        logger.info("Vector DB stats: %s", stats)
    except Exception as exc:
        logger.warning("Could not retrieve stats: %s", exc)

    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="KAVACH document ingestion pipeline")
    parser.add_argument(
        "--no-web",
        action="store_true",
        help="Skip web scraping, use only built-in corpus",
    )
    args = parser.parse_args()

    result = run_ingestion(include_web=not args.no_web)

    if result["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
