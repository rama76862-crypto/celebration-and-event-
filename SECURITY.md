# Security Policy & Architecture Review

## Threat Model & Mitigations

This application is engineered following the principle of defense-in-depth, prioritizing data privacy, injection mitigation, denial-of-service resilience, and transport layer protection.

| Threat Category | Potential Impact | Implemented Mitigation | Verification |
| :--- | :--- | :--- | :--- |
| **Secret Exposure** | Leaking LLM API credentials | API keys loaded purely via environment variables (`AI_API_KEY`). Exception handlers mask raw exceptions and never log or reflect credentials. `.env` is excluded in `.gitignore`. | Verified by `test_response_never_contains_the_api_key`. |
| **Prompt Injection** | User notes hijacking LLM instructions | User input is wrapped inside explicit `<UNTRUSTED_USER_PREFERENCES>` boundaries. System prompt enforces strict role isolation. Output is strictly validated against a Pydantic schema. | Verified by `test_injection_text_in_notes_does_not_alter_schema`. |
| **Cross-Site Scripting (XSS)** | Execution of malicious client-side code | The frontend strictly uses `document.createElement` and `textContent`. Dynamic data is never inserted via `innerHTML`. A strict Content Security Policy (`CSP`) is served on all endpoints. | Code audit confirms zero dynamic `innerHTML`. |
| **Malformed Input / Overflows** | Crashes, memory exhaustion, invalid states | Strict Pydantic schemas with `extra="forbid"`, numeric bounds (guests 1-1,000; budget max 10M), future date enforcement, and control-character sanitization regex. | Verified by `test_models.py` and `test_edge_cases.py`. |
| **Denial of Service (DoS)** | Resource exhaustion from spamming API | Sliding window in-memory rate limiter enforcing a cap of 20 requests/minute per client IP (HTTP 429). Payload size limit capped at 100 KB (HTTP 413). Reverse proxy safe IP resolution via `X-Forwarded-For`. | Verified by `test_rate_limit_returns_429` and `test_rate_limiter_with_forwarded_for_header`. |
| **Service Outage / AI Downtime** | App failure when AI is down or unconfigured | Fallback to a curated, rule-based database in `app/planner/rules.py`. Deterministic money and scheduling algorithms operate 100% offline. | Verified by `test_missing_api_key_triggers_fallback` and `test_works_with_ai_disabled_fallback_source`. |
| **MIME Sniffing & Clickjacking** | Protocol downgrade, iframe embedding | Strict response headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `COOP`, `CORP`, `COEP`. | Verified by `test_security_headers_present` and `test_extended_security_headers`. |

## Security Headers Implemented

Every HTTP response emits the following headers:
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:3000 http://127.0.0.1:3000 https://*.vercel.app https://*.onrender.com; frame-ancestors 'none';`
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: `geolocation=(), camera=(), microphone=()`
- `Cross-Origin-Opener-Policy`: `same-origin`
- `Cross-Origin-Resource-Policy`: `cross-origin`
- `Cross-Origin-Embedder-Policy`: `credentialless`

## Reporting Vulnerabilities
To report potential security vulnerabilities or weaknesses, please open a private security advisory on GitHub or contact the maintainers directly.
