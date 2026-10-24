"""Pydantic data models and schemas for Event Planning Assistant."""

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    """Health check response schema."""

    model_config = ConfigDict(extra="forbid")
    status: str
