"""Integration tests for FastAPI endpoints, security headers, and rate limiting."""

import asyncio
from dataclasses import replace
from datetime import date, timedelta
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from starlette.requests import Request
from starlette.responses import JSONResponse

from app import main
from app.main import _ip_request_timestamps, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Clear in-memory rate limit logs before each test."""
    _ip_request_timestamps.clear()


def make_payload(event_type: str = "wedding") -> dict:
    """Helper returning a valid event plan payload."""
    future_date = (date.today() + timedelta(days=90)).isoformat()
    return {
        "event_type": event_type,
        "title": f"Grand {event_type.capitalize()} Celebration",
        "guest_count": 100,
        "total_budget": 300000.0,
        "currency": "INR",
        "event_date": future_date,
        "location": "Mumbai",
        "city_tier": "metro",
        "preferences": {
            "theme": "Contemporary Elegance",
            "dietary": ["vegetarian"],
            "indoor_outdoor": "indoor",
            "priorities": ["food", "decor", "venue"],
            "age_group": "adults",
            "notes": "Looking for elegant ambient lighting and live music.",
        },
    }


def test_api_plan_happy_path_for_each_event_type() -> None:
    """Verify /api/plan returns complete plan for wedding, birthday, and community."""
    for ev_type in ["wedding", "birthday", "community"]:
        payload = make_payload(ev_type)
        response = client.post("/api/plan", json=payload)
        assert response.status_code == 200, response.text
        data = response.json()

        assert "budget" in data
        assert "timeline" in data
        assert "vendors" in data
        assert "ideas" in data

        # Check budget
        assert len(data["budget"]["categories"]) > 0
        assert data["budget"]["total_budget"] == payload["total_budget"]

        # Check timeline
        assert len(data["timeline"]["all_tasks_sorted"]) > 0
        assert len(data["timeline"]["run_of_show"]) > 0

        # Check vendors
        assert len(data["vendors"]["recommended_vendors"]) > 0

        # Check ideas
        assert data["ideas"]["source"] in ["ai", "fallback"]
        assert len(data["ideas"]["theme_concepts"]) > 0


def test_plan_response_matches_the_nextjs_rendering_contract() -> None:
    """Protect the API field names consumed directly by the deployed frontend."""
    response = client.post("/api/plan", json=make_payload())
    assert response.status_code == 200, response.text
    data = response.json()

    assert set(data["budget"]) == {
        "event_type",
        "total_budget",
        "currency",
        "per_guest_cost",
        "categories",
        "total_allocated",
        "contingency_percentage",
        "contingency_amount",
        "benchmark_warnings",
        "notes",
    }
    assert data["budget"]["total_allocated"] == data["budget"]["total_budget"]
    assert {"all_tasks_sorted", "phases", "run_of_show"} <= set(data["timeline"])
    assert {"recommended_vendors", "skipped_vendors"} <= set(data["vendors"])
    assert {"theme_concepts", "menu_recommendations", "budget_hacks"} <= set(data["ideas"])


def test_validation_errors_return_422() -> None:
    """Invalid requests must return HTTP 422 with structured error details."""
    payload = make_payload()
    payload["guest_count"] = -5  # invalid

    response = client.post("/api/plan", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "errors" in data or "detail" in data


def test_rate_limit_returns_429() -> None:
    """Spoofed forwarded headers cannot evade the per-client request limit."""
    payload = make_payload()

    # The TestClient peer remains constant while the attacker supplies a new
    # forged X-Forwarded-For value with every request.
    for index in range(20):
        resp = client.post(
            "/api/budget",
            json=payload,
            headers={"X-Forwarded-For": f"203.0.113.{index}"},
        )
        assert resp.status_code == 200

    rate_limited_resp = client.post(
        "/api/budget",
        json=payload,
        headers={"X-Forwarded-For": "198.51.100.42"},
    )
    assert rate_limited_resp.status_code == 429
    assert "Rate limit exceeded" in rate_limited_resp.json()["detail"]
    assert "default-src 'self'" in rate_limited_resp.headers["Content-Security-Policy"]


def test_response_never_contains_the_api_key() -> None:
    """Verify responses do not leak the configured API key."""
    fake_key = "AIzaSySecretFakeApiKey12345"
    payload = make_payload()

    # Even if an API key exists in config, it must never appear in response body or headers
    response = client.post("/api/plan", json=payload)
    assert fake_key not in response.text
    for _header, value in response.headers.items():
        assert fake_key not in value


def test_works_with_ai_disabled_fallback_source() -> None:
    """When no API key is provided, ideas endpoint falls back cleanly."""
    payload = make_payload()
    response = client.post("/api/ideas", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Without API key configured, source must be 'fallback'
    assert data["source"] in ["ai", "fallback"]
    assert len(data["menu_recommendations"]) > 0


def test_security_headers_present() -> None:
    """Verify CSP, nosniff, DENY, and Referrer-Policy headers on responses."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Permissions-Policy") == "geolocation=(), camera=(), microphone=()"
    assert "default-src 'self'" in resp.headers.get("Content-Security-Policy", "")


def test_oversized_payload_returns_413() -> None:
    """Requests exceeding 100KB limit should be rejected with HTTP 413."""
    oversized_data = "a" * 120_000
    headers = {"content-length": str(len(oversized_data))}
    resp = client.post("/api/plan", content=oversized_data, headers=headers)
    assert resp.status_code == 413
    assert "exceeds maximum allowed limit" in resp.json()["detail"]
    assert "default-src 'self'" in resp.headers["Content-Security-Policy"]


def test_client_ip_uses_forwarded_header_only_from_a_trusted_proxy() -> None:
    """Forwarded client IPs are honored only after explicit proxy opt-in."""
    untrusted_request = Request(
        {
            "type": "http",
            "method": "GET",
            "headers": [(b"x-forwarded-for", b"203.0.113.8")],
            "client": ("198.51.100.9", 12345),
            "scheme": "http",
            "server": ("testserver", 80),
            "path": "/api/plan",
            "query_string": b"",
        }
    )
    assert main.get_client_ip(untrusted_request) == "198.51.100.9"

    trusted_settings = replace(
        main.settings,
        trust_proxy_headers=True,
        trusted_proxy_ips=("198.51.100.9",),
    )
    with patch.object(main, "settings", trusted_settings):
        assert main.get_client_ip(untrusted_request) == "203.0.113.8"
        request_without_forwarded_header = Request(
            {
                "type": "http",
                "method": "GET",
                "headers": [],
                "client": ("198.51.100.9", 12345),
                "scheme": "http",
                "server": ("testserver", 80),
                "path": "/api/plan",
                "query_string": b"",
            }
        )
        assert main.get_client_ip(request_without_forwarded_header) == "198.51.100.9"


def test_invalid_content_length_is_a_safe_client_error() -> None:
    """Malformed Content-Length headers receive a protected 400 response."""
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "headers": [(b"content-length", b"not-a-number")],
            "client": ("198.51.100.10", 12345),
            "scheme": "http",
            "server": ("testserver", 80),
            "path": "/api/plan",
            "query_string": b"",
        }
    )

    async def call_next(_: Request) -> JSONResponse:
        return JSONResponse({"status": "unexpected"})

    response = asyncio.run(main.security_and_rate_limit_middleware(request, call_next))
    assert response.status_code == 400
    assert response.body == b'{"detail":"Invalid Content-Length header."}'
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]


def test_api_replan_endpoint_happy_path() -> None:
    """Verify /api/replan accepts changes, recalculates plan, and provides diff and advice."""
    orig_payload = make_payload()
    replan_payload = {
        "original_request": orig_payload,
        "new_budget": 450000.0,
        "new_guest_count": 120,
    }
    resp = client.post("/api/replan", json=replan_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "new_plan" in data
    assert "diff" in data
    assert "advice" in data
    assert data["new_plan"]["budget"]["total_budget"] == 450000.0
    assert len(data["diff"]["category_shifts"]) > 0

