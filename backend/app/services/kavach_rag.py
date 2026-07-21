"""KAVACH RAG Service — Upstash Vector DB + Groq LLM pipeline.

Handles embedding generation, document storage, semantic search, and
LLM-augmented response generation for fraud awareness queries.
"""
from __future__ import annotations

import hashlib
import logging
import os

# ---------------------------------------------------------------------------
# Redirect ALL HuggingFace / xet paths to a local writable directory BEFORE
# any HF imports. The xet transport (new HF download protocol) tries to write
# logs to wherever HF_HOME points; if HF_HOME is a system path like
# "D:\Program Files\AI_Models\huggingface" the log write fails with
# "Access is denied (os error 5)" and the entire download aborts.
# ---------------------------------------------------------------------------
_HF_CACHE = os.path.join(os.path.dirname(__file__), "..", "..", ".hf_cache")
_HF_CACHE = os.path.abspath(_HF_CACHE)

_XET_LOG_DIR = os.path.join(_HF_CACHE, "xet", "logs")
os.makedirs(_XET_LOG_DIR, exist_ok=True)
os.makedirs(_HF_CACHE, exist_ok=True)

# Override every path the HF + xet stack may consult
os.environ["HF_HOME"] = _HF_CACHE
os.environ["HUGGINGFACE_HUB_CACHE"] = os.path.join(_HF_CACHE, "hub")
os.environ["TRANSFORMERS_CACHE"] = os.path.join(_HF_CACHE, "hub")
os.environ["SENTENCE_TRANSFORMERS_HOME"] = _HF_CACHE
os.environ["HF_XET_LOG_DIR"] = _XET_LOG_DIR
os.environ["XET_LOG_DIR"] = _XET_LOG_DIR
# Also point the legacy HF_DATASETS_CACHE so nothing slips through
os.environ.setdefault("HF_DATASETS_CACHE", os.path.join(_HF_CACHE, "datasets"))

from typing import Optional

from groq import Groq
from sentence_transformers import SentenceTransformer
from upstash_vector import Index
from upstash_vector.types import SparseVector

from app.config import settings
from app.services.kavach_scraper import Document

logger = logging.getLogger(__name__)


class KavachRAG:
    """RAG pipeline for KAVACH citizen safety chatbot."""

    def __init__(self):
        # Upstash Vector DB client
        self.vector_index = Index(
            url=settings.upstash_vector_url,
            token=settings.upstash_vector_token,
        )

        # Embedding model (384-dimensional)
        embedding_model_name = getattr(settings, "kavach_embedding_model", "all-MiniLM-L6-v2")
        self.embedding_model = SentenceTransformer(embedding_model_name)

        # Groq LLM client
        self.groq_client = Groq(api_key=settings.groq_api_key)
        self.llm_model = settings.groq_model

        # RAG parameters
        self.top_k = getattr(settings, "kavach_top_k", 5)
        self.min_score = getattr(settings, "kavach_min_score", 0.3)

        logger.info(
            "KAVACH RAG initialized: model=%s, top_k=%d, min_score=%.2f",
            embedding_model_name,
            self.top_k,
            self.min_score,
        )

    def _generate_doc_id(self, doc: Document) -> str:
        """Generate a stable hash-based ID for a document."""
        content_hash = hashlib.sha256(doc.content.encode()).hexdigest()[:16]
        return f"{doc.id}_{content_hash}"

    def _make_sparse_vector(self, text: str) -> SparseVector:
        """Build a TF-based SparseVector for hybrid indexing."""
        import re
        from collections import Counter
        tokens = re.findall(r"\b\w+\b", text.lower())
        counts = Counter(tokens)
        total = max(sum(counts.values()), 1)
        indices = []
        values = []
        for word, freq in counts.items():
            indices.append(abs(hash(word)) % 30000)
            values.append(round(freq / total, 6))
        return SparseVector(indices=indices, values=values)

    def embed_text(self, text: str) -> list[float]:
        """Generate 1536-dim embedding vector (padded from 384 to match Upstash index)."""
        embedding = self.embedding_model.encode(text, convert_to_tensor=False)
        vec = embedding.tolist()
        # Upstash index was created with 1536 dimensions; pad with zeros to match
        if len(vec) < 1536:
            vec = vec + [0.0] * (1536 - len(vec))
        return vec[:1536]

    def index_document(self, doc: Document) -> bool:
        """Index a single document into Upstash Vector DB (Hybrid: dense + sparse)."""
        try:
            vector_id = self._generate_doc_id(doc)
            embedding = self.embed_text(doc.content)
            sparse = self._make_sparse_vector(doc.content)

            self.vector_index.upsert(
                vectors=[
                    {
                        "id": vector_id,
                        "vector": embedding,
                        "sparse_vector": sparse,
                        "metadata": {
                            "doc_id": doc.id,
                            "title": doc.title,
                            "source": doc.source,
                            "category": doc.category,
                            "content": doc.content[:500],  # truncate for metadata size
                            "url": doc.url,
                        },
                    }
                ]
            )
            logger.debug("Indexed document: %s", doc.id)
            return True
        except Exception as exc:
            logger.error("Failed to index document %s: %s", doc.id, exc)
            return False

    def index_documents_batch(self, docs: list[Document]) -> dict:
        """Index multiple documents in batch."""
        success_count = 0
        failed = []

        for doc in docs:
            if self.index_document(doc):
                success_count += 1
            else:
                failed.append(doc.id)

        logger.info("Indexed %d/%d documents", success_count, len(docs))
        return {
            "total": len(docs),
            "success": success_count,
            "failed": len(failed),
            "failed_ids": failed,
        }

    def search_similar(self, query: str, top_k: Optional[int] = None) -> list[dict]:
        """Search for similar documents in the vector store (hybrid: dense + sparse)."""
        if top_k is None:
            top_k = self.top_k

        try:
            query_embedding = self.embed_text(query)
            query_sparse = self._make_sparse_vector(query)
            results = self.vector_index.query(
                vector=query_embedding,
                sparse_vector=query_sparse,
                top_k=top_k,
                include_metadata=True,
            )

            # Filter by minimum score and extract metadata
            filtered = []
            for result in results:
                score = result.score
                if score >= self.min_score:
                    filtered.append({
                        "score": score,
                        "doc_id": result.metadata.get("doc_id", ""),
                        "title": result.metadata.get("title", ""),
                        "category": result.metadata.get("category", ""),
                        "content": result.metadata.get("content", ""),
                        "source": result.metadata.get("source", ""),
                        "url": result.metadata.get("url", ""),
                    })

            logger.info("Retrieved %d relevant documents for query", len(filtered))
            return filtered

        except Exception as exc:
            logger.error("Search failed: %s", exc)
            return []

    def generate_response(
        self,
        user_query: str,
        context_docs: list[dict],
        conversation_history: Optional[list[dict]] = None,
    ) -> dict:
        """Generate LLM response using retrieved context."""
        if not context_docs:
            return {
                "reply": (
                    "मुझे खेद है, मेरे पास इस सवाल का जवाब नहीं है। कृपया राष्ट्रीय साइबर क्राइम हेल्पलाइन 1930 पर कॉल करें। "
                    "I'm sorry, I don't have information about this. Please call the National Cyber Crime Helpline 1930."
                ),
                "sources": [],
                "riskLevel": "safe",
                "intents": ["fallback"],
                "quickActions": ["Call 1930", "Report a scam"],
            }

        # Build context from retrieved documents
        context_text = "\n\n".join([
            f"[{doc['title']}]\n{doc['content']}"
            for doc in context_docs[:3]  # Use top 3 documents
        ])

        # Detect risk level from categories
        categories = {doc["category"] for doc in context_docs}
        risk_level = self._determine_risk_level(categories)

        # Build prompt
        system_prompt = """You are KAVACH (कवच), an AI-powered fraud awareness assistant for Indian citizens. 
Your mission is to protect citizens from cybercrime, fraud, and digital arrest scams.

Guidelines:
- Answer ONLY based on the provided context documents
- Be empathetic and supportive
- Provide actionable steps and safety tips
- Always mention the 1930 helpline for emergencies
- Use simple Hindi + English mix (Hinglish) when appropriate
- If the context doesn't contain the answer, say so clearly
- For digital arrest or urgent threats, emphasize immediate action

Context Documents:
{context}

User Question: {query}

Provide a clear, actionable response in 3-4 sentences."""

        messages = []
        if conversation_history:
            messages.extend(conversation_history[-4:])  # Last 2 turns

        messages.append({
            "role": "user",
            "content": system_prompt.format(context=context_text, query=user_query)
        })

        try:
            completion = self.groq_client.chat.completions.create(
                model=self.llm_model,
                messages=messages,
                temperature=0.3,
                max_tokens=400,
            )

            reply = completion.choices[0].message.content.strip()

            # Extract sources
            sources = [
                {"title": doc["title"], "category": doc["category"]}
                for doc in context_docs[:3]
            ]

            # Determine intents and quick actions
            intents = self._extract_intents(user_query, categories)
            quick_actions = self._generate_quick_actions(categories, risk_level)

            return {
                "reply": reply,
                "sources": sources,
                "riskLevel": risk_level,
                "intents": intents,
                "quickActions": quick_actions,
            }

        except Exception as exc:
            logger.error("LLM generation failed: %s", exc)
            return {
                "reply": (
                    "मुझे तकनीकी समस्या का सामना करना पड़ रहा है। कृपया 1930 पर कॉल करें। "
                    "I'm experiencing a technical issue. Please call 1930 for immediate help."
                ),
                "sources": [],
                "riskLevel": "warning",
                "intents": ["error"],
                "quickActions": ["Call 1930"],
            }

    def _determine_risk_level(self, categories: set[str]) -> str:
        """Determine risk level based on document categories."""
        high_risk = {"digital_arrest", "otp_kyc_fraud", "identity_theft"}
        medium_risk = {"upi_fraud", "phishing", "loan_fraud", "investment_fraud"}

        if categories & high_risk:
            return "danger"
        elif categories & medium_risk:
            return "warning"
        else:
            return "safe"

    def _extract_intents(self, query: str, categories: set[str]) -> list[str]:
        """Extract user intents from query and matched categories."""
        query_lower = query.lower()
        intents = []

        if any(word in query_lower for word in ["digital arrest", "cbi", "ed", "video call", "arrest"]):
            intents.append("digital_arrest")
        if any(word in query_lower for word in ["upi", "payment", "money", "transfer"]):
            intents.append("upi_fraud")
        if any(word in query_lower for word in ["otp", "kyc", "verify"]):
            intents.append("otp_kyc")
        if any(word in query_lower for word in ["fake note", "counterfeit", "currency"]):
            intents.append("counterfeit_currency")
        if any(word in query_lower for word in ["help", "emergency", "urgent", "threat"]):
            intents.append("emergency")
        if any(word in query_lower for word in ["report", "complaint", "file"]):
            intents.append("report_scam")

        # Add category-based intents
        for cat in categories:
            if cat not in intents:
                intents.append(cat)

        return intents[:4]  # Limit to 4 intents

    def _generate_quick_actions(self, categories: set[str], risk_level: str) -> list[str]:
        """Generate contextual quick action buttons."""
        actions = []

        if risk_level == "danger":
            actions.append("Call 1930 Now")
            actions.append("File Complaint")
        elif risk_level == "warning":
            actions.append("Call 1930")
            actions.append("Check Phone Number")
        else:
            actions.append("Check a Number")
            actions.append("Report a Scam")

        if "counterfeit_currency" in categories:
            actions.append("Scan Currency Note")

        if "digital_arrest" in categories:
            actions.append("Digital Arrest Help")

        return actions[:3]  # Limit to 3 actions

    def chat(
        self,
        user_message: str,
        session_id: Optional[str] = None,
        conversation_history: Optional[list[dict]] = None,
    ) -> dict:
        """Main chat interface — search + generate response."""
        logger.info("KAVACH chat query: %s", user_message[:80])

        # Search for relevant documents
        context_docs = self.search_similar(user_message)

        # Generate response
        response = self.generate_response(user_message, context_docs, conversation_history)

        return response

    def get_index_stats(self) -> dict:
        """Get statistics about the vector index."""
        try:
            info = self.vector_index.info()
            # InfoResult is an object, not a dict — use getattr
            return {
                "total_vectors": getattr(info, "vector_count", 0) or getattr(info, "vectorCount", 0),
                "dimension": getattr(info, "dimension", 1536),
                "similarity_function": getattr(info, "similarity_function", "COSINE"),
            }
        except Exception as exc:
            logger.error("Failed to get index stats: %s", exc)
            return {}


# Singleton instance
_rag_instance: Optional[KavachRAG] = None


def get_rag() -> KavachRAG:
    """Get or create the singleton RAG instance."""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = KavachRAG()
    return _rag_instance
