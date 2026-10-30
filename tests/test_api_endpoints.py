"""Tests covering individual API endpoints, metadata, static fallback, and error handling."""

from datetime import date, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def make_payload() -> dict:
    """Helper returning a standard valid payload with correct enums."""
    future_date = (date.today() + timedelta(days=60)).isoformat()
    return {
        "event_type": "birthday",
        "title": "Neon Jubilee",
        "guest_count": 50,
        "total_budget": 150000.0,
        "currency": "INR",
        "event_date": future_date,
        "location": "Bengaluru",
        "city_tier": "metro",
        "preferences": {
            "theme": "Cyberpunk Neon Lounge",
            "dietary": ["vegan"],
            "indoor_outdoor": "indoor",
            "priorities": ["decor", "music"],
            "age_group": "adults",
            "notes": "Need LED walls and synthwave acoustics.",
        },
    }


def test_root_endpoint() -> None:
    """GET / returns service status JSON or serves static content."""
    resp = client.get("/")
    assert resp.status_code == 200

    # Also test fallback dictionary return when static dir is absent
    with patch("os.path.isdir", return_value=False):
        resp2 = client.get("/")
        assert resp2.status_code == 200
        assert resp2.json()["service"] == "Celebration & Event Studio API"


def test_metadata_endpoint() -> None:
    """GET /api/event-types returns metadata choices for frontend selects."""
    resp = client.get("/api/event-types")
    assert resp.status_code == 200
    data = resp.json()
    assert "event_types" in data
    assert "priorities" in data
    assert "currencies" in data
    assert "dietary_options" in data
    assert "indoor_outdoor" in data
    assert "age_groups" in data
    assert "city_tiers" in data
    assert "wedding" in data["event_types"]


def test_individual_budget_endpoint() -> None:
    """POST /api/budget returns adapted budget breakdown."""
    resp = client.post("/api/budget", json=make_payload())
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_budget"] == 150000.0
    assert len(data["categories"]) > 0


def test_individual_timeline_endpoint() -> None:
    """POST /api/timeline returns adapted backwards timeline."""
    resp = client.post("/api/timeline", json=make_payload())
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["all_tasks_sorted"]) > 0
    assert len(data["phases"]) > 0


def test_individual_vendors_endpoint() -> None:
    """POST /api/vendors returns adapted vendor checklist."""
    resp = client.post("/api/vendors", json=make_payload())
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommended_vendors"]) > 0


def test_individual_ideas_endpoint() -> None:
    """POST /api/ideas returns adapted creative ideas."""
    resp = client.post("/api/ideas", json=make_payload())
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["theme_concepts"]) > 0


def test_replan_with_new_date() -> None:
    """POST /api/replan correctly recomputes when event date changes."""
    orig = make_payload()
    new_date = (date.today() + timedelta(days=120)).isoformat()
    resp = client.post(
        "/api/replan",
        json={
            "original_request": orig,
            "new_event_date": new_date,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["diff"]["date_shift_days"] == 60


def test_rate_limiter_with_forwarded_for_header() -> None:
    """Rate limiter extracts IP from X-Forwarded-For header properly."""
    custom_ip = "203.0.113.195"
    headers = {"X-Forwarded-For": f"{custom_ip}, 198.51.100.1"}
    resp = client.post("/api/budget", json=make_payload(), headers=headers)
    assert resp.status_code == 200


def test_generic_exception_handler_masks_unhandled_errors() -> None:
    """Any unhandled internal exception is masked with HTTP 500 without leaking details."""
    client_no_raise = TestClient(app, raise_server_exceptions=False)
    with patch("app.main.generate_budget_plan", side_effect=RuntimeError("Secret database crash")):
        resp = client_no_raise.post("/api/budget", json=make_payload())
        assert resp.status_code == 500
        assert "An unexpected server error occurred" in resp.json()["detail"]
        assert "Secret database crash" not in resp.text


def test_extended_security_headers() -> None:
    """Verify HSTS, COOP, CORP, and COEP headers are delivered."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "max-age=31536000" in resp.headers.get("Strict-Transport-Security", "")
    assert resp.headers.get("Cross-Origin-Opener-Policy") == "same-origin"
    assert resp.headers.get("Cross-Origin-Resource-Policy") == "cross-origin"
    assert resp.headers.get("Cross-Origin-Embedder-Policy") == "credentialless"
