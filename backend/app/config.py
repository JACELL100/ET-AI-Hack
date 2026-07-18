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

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
