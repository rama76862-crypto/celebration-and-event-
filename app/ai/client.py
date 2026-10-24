"""Provider-agnostic LLM client wrapper with safe caching, retry, and fallback."""

import hashlib
import json
import logging
from typing import Dict, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class AIUnavailable(Exception):
    """Raised when the AI service is unavailable, unconfigured, or fails."""
    pass


class AIClient:
    """Wrapper for calling LLM API providers with timeout, retry, and local cache."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_seconds: float = 20.0,
    ):
        self.api_key = (api_key if api_key is not None else settings.ai_api_key).strip()
        self.model = (model if model is not None else settings.ai_model).strip() or "gemini-1.5-flash"
        self.base_url = (base_url if base_url is not None else settings.ai_base_url).strip()
        self.timeout = timeout_seconds
        self._cache: Dict[str, str] = {}

    def _compute_cache_key(self, system_prompt: str, user_prompt: str) -> str:
        """Compute SHA-256 hash of prompt inputs to avoid redundant API calls."""
        content = f"{self.model}||{system_prompt}||{user_prompt}".encode("utf-8")
        return hashlib.sha256(content).hexdigest()

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Call the AI provider and return response text, or raise AIUnavailable."""
        if not self.api_key:
            raise AIUnavailable("AI API key is missing or not configured")

        cache_key = self._compute_cache_key(system_prompt, user_prompt)
        if cache_key in self._cache:
            return self._cache[cache_key]

        last_error: Optional[Exception] = None

        # Max 1 retry
        for attempt in range(2):
            try:
                response_text = self._execute_call(system_prompt, user_prompt)
                self._cache[cache_key] = response_text
                return response_text
            except Exception as exc:
                last_error = exc
                logger.warning("AI call attempt %d failed: %s", attempt + 1, type(exc).__name__)

        raise AIUnavailable(f"AI service call failed after retry: {type(last_error).__name__}") from last_error

    def _execute_call(self, system_prompt: str, user_prompt: str) -> str:
        """Dispatch HTTP request to Google Gemini API or OpenAI-compatible endpoint."""
        with httpx.Client(timeout=self.timeout) as client:
            if self.base_url:
                # OpenAI-compatible completions format
                url = f"{self.base_url.rstrip('/')}/chat/completions"
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500,
                }
                headers = {"Authorization": f"Bearer {self.api_key}"}
                resp = client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                # Default Google Gemini REST API format
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{self.model}:generateContent?key={self.api_key}"
                )
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": f"System Instructions:\n{system_prompt}\n\nTask:\n{user_prompt}"}
                            ],
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 1500,
                    },
                }
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
