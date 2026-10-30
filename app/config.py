"""Environment configuration settings for Event Planning Assistant."""

import os
from dataclasses import dataclass
from typing import Tuple

from dotenv import load_dotenv

# Load local .env if present
load_dotenv()


@dataclass(frozen=True)
class Settings:
    """Application settings read from environment variables."""

    # AI settings
    ai_api_key: str = os.getenv("AI_API_KEY", "").strip()
    ai_model: str = os.getenv("AI_MODEL", "gemini-1.5-flash").strip()
    ai_base_url: str = os.getenv("AI_BASE_URL", "").strip()

    # Server settings
    host: str = os.getenv("HOST", "127.0.0.1").strip()
    port: int = int(os.getenv("PORT", "8000"))
    environment: str = os.getenv("ENVIRONMENT", "development").strip()
    frontend_origins: Tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    )
    # Forwarded client-IP headers are only reliable when the direct peer is a
    # reverse proxy that overwrites them. Keep this opt-in and explicitly
    # allow-list those proxies to prevent client-controlled rate-limit keys.
    trust_proxy_headers: bool = os.getenv("TRUST_PROXY_HEADERS", "false").lower() == "true"
    trusted_proxy_ips: Tuple[str, ...] = tuple(
        ip.strip()
        for ip in os.getenv("TRUSTED_PROXY_IPS", "").split(",")
        if ip.strip()
    )

    @property
    def has_ai_key(self) -> bool:
        """Check whether an AI API key is configured."""
        return bool(self.ai_api_key)


settings = Settings()
