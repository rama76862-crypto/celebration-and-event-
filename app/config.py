"""Environment configuration settings for Event Planning Assistant."""

import os
from dataclasses import dataclass

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

    @property
    def has_ai_key(self) -> bool:
        """Check whether an AI API key is configured."""
        return bool(self.ai_api_key)


settings = Settings()
