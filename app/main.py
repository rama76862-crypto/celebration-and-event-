"""FastAPI application with security middleware, rate limiting, and planner endpoints."""

import logging
import os
import time
from collections import defaultdict
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.models import (
    EventRequest,
    BudgetPlan,
    TimelinePlan,
    VendorChecklist,
    IdeaSet,
    FullPlan,
    HealthResponse,
    ReplanRequest,
    ReplanResponse,
    EventType,
    PriorityCategory,
    AllowedCurrency,
    DietaryOption,
    IndoorOutdoor,
    AgeGroup,
    CityTier,
)
from app.planner.budget import generate_budget_plan
from app.planner.timeline import generate_timeline_plan
from app.planner.vendors import generate_vendor_checklist
from app.planner.ideas import generate_ideas
from app.planner.advisor import compute_plan_diff, generate_smart_advice

logger = logging.getLogger("event_planner")

app = FastAPI(
    title="GenAI Event Planning Assistant API",
    description="Intelligent orchestrator for budgets, timelines, vendors, and personalized ideas.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# In-memory Rate Limiting (20 requests/minute per client IP)
# ---------------------------------------------------------------------------
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 20
_ip_request_timestamps: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(client_ip: str) -> bool:
    """Return True if request is within allowance, False if rate limited."""
    now = time.time()
    timestamps = _ip_request_timestamps[client_ip]

    # Filter out timestamps older than the rate limit window
    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    _ip_request_timestamps[client_ip] = valid_timestamps

    if len(valid_timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        return False

    _ip_request_timestamps[client_ip].append(now)
    return True


# ---------------------------------------------------------------------------
# Middleware: Security Headers, Request Size Limits, Rate Limiting
# ---------------------------------------------------------------------------
MAX_CONTENT_LENGTH = 100_000  # 100 KB limit for payload security


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next) -> Response:
    # 1. Enforce payload size limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_CONTENT_LENGTH:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": "Request body size exceeds maximum allowed limit (100KB)."},
        )

    # 2. Rate limiting (apply to API endpoints, bypass /health)
    path = request.url.path
    if path.startswith("/api/"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        if not check_rate_limit(client_ip):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Maximum 20 requests per minute allowed."},
            )

    response = await call_next(request)

    # 3. Security Headers
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response


# Restrict CORS to same origin by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handlers (never leak stack traces or keys)
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return clean, human-readable 422 validation error messages."""
    errors: List[str] = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Validation error")
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Mask unexpected errors with safe generic response."""
    logger.error("Unhandled exception processing %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Core API Routes
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(status="ok")


@app.get("/api/event-types", tags=["Metadata"])
def get_metadata() -> Dict[str, Any]:
    """Provide choices and enum values for frontend form population."""
    return {
        "event_types": [e.value for e in EventType],
        "priorities": [p.value for p in PriorityCategory],
        "currencies": [c.value for c in AllowedCurrency],
        "dietary_options": [d.value for d in DietaryOption],
        "indoor_outdoor": [i.value for i in IndoorOutdoor],
        "age_groups": [a.value for a in AgeGroup],
        "city_tiers": [ct.value for ct in CityTier],
    }


@app.post("/api/budget", response_model=BudgetPlan, tags=["Planner"])
def create_budget(request: EventRequest) -> BudgetPlan:
    """Generate budget breakdown only."""
    return generate_budget_plan(request)


@app.post("/api/timeline", response_model=TimelinePlan, tags=["Planner"])
def create_timeline(request: EventRequest) -> TimelinePlan:
    """Generate backwards-planned timeline only."""
    return generate_timeline_plan(request)


@app.post("/api/vendors", response_model=VendorChecklist, tags=["Planner"])
def create_vendors(request: EventRequest) -> VendorChecklist:
    """Generate vendor checklist dependent on budget and timeline."""
    budget = generate_budget_plan(request)
    timeline = generate_timeline_plan(request)
    return generate_vendor_checklist(request, budget, timeline)


@app.post("/api/ideas", response_model=IdeaSet, tags=["Planner"])
def create_ideas(request: EventRequest) -> IdeaSet:
    """Generate personalized ideas using AI with curated fallback."""
    per_guest = request.total_budget / request.guest_count
    return generate_ideas(request, per_guest_cost=per_guest)


@app.post("/api/plan", response_model=FullPlan, tags=["Planner"])
def create_full_plan(request: EventRequest) -> FullPlan:
    """Orchestrate full event plan in logical order: budget -> timeline -> vendors -> ideas."""
    budget = generate_budget_plan(request)
    timeline = generate_timeline_plan(request)
    vendors = generate_vendor_checklist(request, budget, timeline)
    ideas = generate_ideas(request, per_guest_cost=budget.per_guest_cost)

    return FullPlan(
        request=request,
        budget=budget,
        timeline=timeline,
        vendors=vendors,
        ideas=ideas,
    )


@app.post("/api/replan", response_model=ReplanResponse, tags=["Planner"])
def replan_event(payload: ReplanRequest) -> ReplanResponse:
    """Re-compute plan with modified parameters, returning revised plan, structural diff, and advice."""
    orig = payload.original_request

    # Compute old plan
    old_budget = generate_budget_plan(orig)
    old_timeline = generate_timeline_plan(orig)
    old_vendors = generate_vendor_checklist(orig, old_budget, old_timeline)
    old_ideas = generate_ideas(orig, per_guest_cost=old_budget.per_guest_cost)
    old_plan = FullPlan(
        request=orig,
        budget=old_budget,
        timeline=old_timeline,
        vendors=old_vendors,
        ideas=old_ideas,
    )

    # Build updated request
    updated_fields = orig.model_dump()
    if payload.new_budget is not None:
        updated_fields["total_budget"] = payload.new_budget
    if payload.new_guest_count is not None:
        updated_fields["guest_count"] = payload.new_guest_count
    if payload.new_event_date is not None:
        updated_fields["event_date"] = payload.new_event_date

    revised_req = EventRequest(**updated_fields)

    # Compute new plan
    new_budget = generate_budget_plan(revised_req)
    new_timeline = generate_timeline_plan(revised_req)
    new_vendors = generate_vendor_checklist(revised_req, new_budget, new_timeline)
    new_ideas = generate_ideas(revised_req, per_guest_cost=new_budget.per_guest_cost)
    new_plan = FullPlan(
        request=revised_req,
        budget=new_budget,
        timeline=new_timeline,
        vendors=new_vendors,
        ideas=new_ideas,
    )

    # Compute diff and generate advice
    diff = compute_plan_diff(old_plan, new_plan)
    advice = generate_smart_advice(revised_req, new_budget, new_timeline)

    return ReplanResponse(
        new_plan=new_plan,
        diff=diff,
        advice=advice,
    )



# ---------------------------------------------------------------------------
# Static Files (Mounted last so API routes take precedence)
# ---------------------------------------------------------------------------
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
