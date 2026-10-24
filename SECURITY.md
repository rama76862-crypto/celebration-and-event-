# Security Policy & Architecture Review

## Threat Model & Mitigations

This application is designed following the principle of defense-in-depth, prioritizing data privacy, injection mitigation, and denial-of-service resilience.

| Threat Category | Potential Impact | Implemented Mitigation | Verification |
| :--- | :--- | :--- | :--- |
| **Secret Exposure** | Leaking LLM API credentials | API keys loaded purely via environment variables (`AI_API_KEY`). Exception handlers mask raw exceptions and never log or reflect credentials. `.env` is excluded in `.gitignore`. | Verified by `test_response_never_contains_the_api_key`. |
| **Prompt Injection** | User notes hijacking LLM instructions | User input is wrapped inside explicit `<UNTRUSTED_USER_PREFERENCES>` boundaries. System prompt enforces strict role isolation. Output is strictly validated against a Pydantic schema. | Verified by `test_injection_text_in_notes_does_not_alter_schema`. |
| **Cross-Site Scripting (XSS)** | Execution of malicious client-side code | The frontend strictly uses `document.createElement` and `textContent`. Dynamic data is never inserted via `innerHTML`. A strict Content Security Policy (`CSP`) is served on all endpoints. | Code audit confirms zero dynamic `innerHTML`. |
| **Malformed Input / Overflows** | Crashes, memory exhaustion, invalid states | Strict Pydantic schemas with `extra="forbid"`, numeric bounds (guests 1-1,000; budget max 10M), future date enforcement, and control-character sanitization regex. | Verified by `test_models.py` and `test_edge_cases.py`. |
| **Denial of Service (DoS)** | Resource exhaustion from spamming API | Sliding window in-memory rate limiter enforcing a cap of 20 requests/minute per client IP (HTTP 429). Payload size limit capped at 100 KB (HTTP 413). | Verified by `test_rate_limit_returns_429`. |
| **Service Outage / AI Downtime** | App failure when AI is down or unconfigured | Fallback to a curated, rule-based database in `app/planner/rules.py`. Deterministic money and scheduling algorithms operate 100% offline. | Verified by `test_missing_api_key_triggers_fallback`. |

## Security Headers Implemented

Every HTTP response emits the following headers:
- `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';`
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY`
- `Referrer-Policy`: `strict-origin-when-cross-origin`

## Reporting Vulnerabilities
To report potential security vulnerabilities or weaknesses, please open a private security advisory on GitHub or contact the maintainers directly.
