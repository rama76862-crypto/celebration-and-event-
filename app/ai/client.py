"""Provider-agnostic LLM client wrapper with safe fallback."""


class AIUnavailable(Exception):
    """Raised when the AI service is unavailable or API key is missing."""
    pass


class AIClient:
    """Wrapper for calling LLM API providers with timeout and retry."""

    def __init__(self, api_key: str = "", model: str = "", base_url: str = ""):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate text completion from LLM."""
        raise NotImplementedError("Implemented in Part 6")
