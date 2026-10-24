# Celebration & Event Planner (GenAI-Powered Assistant)

An intelligent, context-aware event planning assistant designed for weddings, birthdays, and community gatherings. Produces adaptive budgets, backward-planned timelines, tailored vendor checklists, and personalized theme/decor ideas.

## Features
- **Smart Budget Engine**: Allocates budget dynamically based on event type, guest count, city tier, dietary constraints, and outdoor needs.
- **Backwards-Planned Timeline**: Auto-schedules milestones leading up to event day, with compressed urgent modes for tight deadlines.
- **Context-Aware Vendor Checklist**: Generates targeted questions, red flags, documents, and budget-filtered vendor lists.
- **Personalized Ideas (AI + Curated Fallback)**: Delivers theme, decor, food, and budget hacks with full offline resilience.
- **Accessible & Lightweight Frontend**: Responsive, accessible WAI-ARIA compliant UI with dark/light themes.

## Quick Start

### 1. Prerequisites
- Python 3.11+
- pip

### 2. Installation
```bash
python -m pip install -r requirements.txt
```

### 3. Environment Setup (Optional)
```bash
copy .env.example .env
# Set AI_API_KEY if available. The app functions seamlessly with curated fallbacks even without an API key!
```

### 4. Running the App
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open http://127.0.0.1:8000 in your browser.

### 5. Running Tests
```bash
pytest
```
