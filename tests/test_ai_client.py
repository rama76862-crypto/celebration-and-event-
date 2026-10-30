"""Comprehensive unit tests for AIClient wrapper, caching, retry, and error handling."""

from unittest.mock import MagicMock, patch

import httpx
import pytest

from app.ai.client import AIClient, AIUnavailable


def test_ai_client_missing_key_raises_unavailable() -> None:
    """Initializing AIClient with no key raises AIUnavailable immediately on generate."""
    client = AIClient(api_key="")
    with pytest.raises(AIUnavailable, match="AI API key is missing"):
        client.generate("system prompt", "user prompt")


def test_ai_client_cache_key_generation() -> None:
    """Prompt hash cache key is deterministic based on model and prompts."""
    client = AIClient(api_key="test-key", model="test-model")
    key1 = client._compute_cache_key("sys", "user")
    key2 = client._compute_cache_key("sys", "user")
    key3 = client._compute_cache_key("sys", "other")
    assert key1 == key2
    assert key1 != key3


def test_ai_client_gemini_format_success() -> None:
    """AIClient handles Google Gemini API response format successfully."""
    client = AIClient(api_key="valid-gemini-key", model="gemini-1.5-flash", base_url="")

    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "{\"theme_concepts\": [\"Celestial Elegance\"]}"}]
                }
            }
        ]
    }
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post:
        result = client.generate("system prompt", "user prompt")
        assert "Celestial Elegance" in result
        assert mock_post.call_count == 1

        # Second call with identical prompts hits cache without calling post again
        cached_result = client.generate("system prompt", "user prompt")
        assert cached_result == result
        assert mock_post.call_count == 1


def test_ai_client_openai_format_success() -> None:
    """AIClient handles OpenAI-compatible completions format when base_url is configured."""
    client = AIClient(
        api_key="valid-openai-key",
        model="gpt-4o-mini",
        base_url="https://api.openai.com/v1",
    )

    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "choices": [
            {"message": {"content": "{\"theme_concepts\": [\"Velvet Midnight\"]}"}}
        ]
    }
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post:
        result = client.generate("system", "user")
        assert "Velvet Midnight" in result
        assert mock_post.call_count == 1


def test_ai_client_retry_succeeds_on_second_attempt() -> None:
    """AIClient retries once upon initial HTTP failure before succeeding."""
    client = AIClient(api_key="test-key", model="gemini-1.5-flash")

    fail_resp = httpx.RequestError("Temporary network glitch")
    success_resp = MagicMock()
    success_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Success on retry"}]}}]
    }
    success_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.post", side_effect=[fail_resp, success_resp]) as mock_post:
        result = client.generate("system", "retry prompt")
        assert result == "Success on retry"
        assert mock_post.call_count == 2


def test_ai_client_fails_after_retries_exhausted() -> None:
    """AIClient raises AIUnavailable when all retry attempts fail."""
    client = AIClient(api_key="test-key", model="gemini-1.5-flash")

    with patch(
        "httpx.Client.post",
        side_effect=httpx.HTTPStatusError("500 Internal Error", request=MagicMock(), response=MagicMock()),
    ) as mock_post:
        with pytest.raises(AIUnavailable, match="AI service call failed after retry"):
            client.generate("system", "fail prompt")
        assert mock_post.call_count == 2
