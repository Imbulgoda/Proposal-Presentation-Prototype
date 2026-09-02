"""Attach visit-date Sri Lanka macro / food-price / event context from approved contract file."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from app.core.config import get_settings


def _context_path() -> Path:
    return get_settings().contracts_dir / "sri_lanka_context.json"


def load_context_catalog() -> dict:
    path = _context_path()
    if not path.exists():
        return {"years": {}, "disclaimer": "Context catalog not found.", "schema_version": "missing"}
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_context_for_visit_date(visit_date: datetime) -> dict:
    catalog = load_context_catalog()
    years = catalog.get("years") or {}
    year_key = str(visit_date.year)
    if year_key not in years:
        year_key = str(catalog.get("default_year") or max(years.keys(), default="2024"))
    row = dict(years.get(year_key) or {})
    return {
        "schema_version": catalog.get("schema_version"),
        "disclaimer": catalog.get("disclaimer"),
        "source_note": catalog.get("source_note"),
        "visit_year": int(year_key) if year_key.isdigit() else visit_date.year,
        "economic_growth_rate_pct": row.get("economic_growth_rate_pct"),
        "food_price_inflation_pct": row.get("food_price_inflation_pct"),
        "food_price_index": row.get("food_price_index"),
        "economy_stress_level": row.get("economy_stress_level"),
        "events": list(row.get("events") or []),
    }


def dietary_diversity_category_from_score(score: int | None) -> str | None:
    if score is None:
        return None
    if score <= 2:
        return "low"
    if score <= 4:
        return "medium"
    return "high"


def exclusive_breastfeeding_from_status(status: str | None) -> bool | None:
    if not status:
        return None
    if status == "exclusive":
        return True
    if status in {"continued", "stopped", "never"}:
        return False
    return None
