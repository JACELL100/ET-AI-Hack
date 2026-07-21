"""Application configuration loaded from environment / .env file.

Uses pydantic-settings so values can be overridden via environment variables
or a local `.env` file (see `.env.example`).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Runtime
    fastapi_debug: bool = True
    fastapi_secret_key: str = "dev-secret-change-me"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    frontend_dev_url: str = "http://localhost:3000"

    # Supabase — set via environment variables or .env file
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # Authkey.io — SMS & Voice alerts
    authkey_api_key: str = ""
    authkey_sender_id: str = "RAKSHA"
    authkey_country_code: str = "91"

    # SENTINEL — AI model configuration
    sentinel_whisper_model: str = "base"        # tiny | base | small | medium | large-v3-turbo
    sentinel_whisper_device: str = "cpu"         # cpu | cuda
    sentinel_threat_threshold_high: float = 70.0
    sentinel_threat_threshold_medium: float = 40.0
    sentinel_similarity_threshold: float = 0.75

    # Trusted live intelligence ingest.  Telecom, video-conferencing, payment
    # and bank partners sign webhook bodies with this shared secret.  Keep it
    # empty only for an explicitly labelled local demo environment.
    integration_hmac_secret: str = ""
    integration_require_signature: bool = False
    integration_max_event_age_seconds: int = 300
    evidence_ledger_path: str = "data_runtime/evidence_ledger.sqlite3"
    evidence_package_db_path: str = "data_runtime/evidence_packages.sqlite3"
    evidence_signing_private_key_path: str = "data_runtime/evidence_signing_private.pem"
    evidence_signing_public_key_path: str = "data_runtime/evidence_signing_public.pem"

    # NCRP/NCRB/state agency feed gateway.  Each authorised producer should
    # receive a distinct secret at the API gateway in production.
    agency_feed_hmac_secret: str = ""
    agency_feed_require_signature: bool = False
    agency_feed_max_event_age_seconds: int = 300
    agency_feed_db_path: str = "data_runtime/agency_feeds.sqlite3"

    # NETRA model registry.  A model is usable only when its model card and
    # hold-out metrics are present; no synthetic fallback verdict is allowed.
    netra_model_dir: str = "data/netra/models"
    netra_dataset_dir: str = "data/netra/datasets"
    netra_min_validation_accuracy: float = 0.90
    netra_max_false_positive_rate: float = 0.05

    # NumVerify — Phone number carrier & owner lookup (numverify.com)
    numverify_api_key: str = ""          # Free: 1000 req/month — https://numverify.com
    numverify_base_url: str = "http://apilayer.net/api/validate"

    # AbstractAPI — Phone validation fallback (abstractapi.com)
    abstract_phone_api_key: str = ""     # Free tier: 500 req/month

    # Groq AI — LLM for WhatsApp chat analysis
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_max_tokens: int = 2048

    # WhatsApp Bridge (Node.js sidecar)
    whatsapp_bridge_url: str = "http://localhost:3001"

    # Upstash Vector DB — for KAVACH RAG knowledge base
    upstash_vector_rest_url: str = ""
    upstash_vector_rest_token: str = ""

    @property
    def upstash_vector_url(self) -> str:
        return self.upstash_vector_rest_url

    @property
    def upstash_vector_token(self) -> str:
        return self.upstash_vector_rest_token

    # KAVACH RAG pipeline settings
    kavach_embedding_model: str = "all-MiniLM-L6-v2"
    kavach_top_k: int = 5
    kavach_min_score: float = 0.01

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
