"""FastAPI main application module for GenAI Event Planning Assistant."""

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.models import HealthResponse

app = FastAPI(
    title="GenAI-Powered Event Planning Assistant",
    description="Intelligent assistant for organizing weddings, birthdays, and community events.",
    version="1.0.0",
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(status="ok")


# Mount static assets directory
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
