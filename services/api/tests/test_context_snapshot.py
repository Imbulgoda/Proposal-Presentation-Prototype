from app.services.context_snapshot import (
    dietary_diversity_category_from_score,
    exclusive_breastfeeding_from_status,
    resolve_context_for_visit_date,
)
from datetime import datetime, timezone


def test_exclusive_breastfeeding_from_status():
    assert exclusive_breastfeeding_from_status("exclusive") is True
    assert exclusive_breastfeeding_from_status("continued") is False
    assert exclusive_breastfeeding_from_status(None) is None


def test_dietary_diversity_category_from_score():
    assert dietary_diversity_category_from_score(1) == "low"
    assert dietary_diversity_category_from_score(4) == "medium"
    assert dietary_diversity_category_from_score(6) == "high"
    assert dietary_diversity_category_from_score(None) is None


def test_resolve_context_for_visit_date_has_food_price_fields():
    ctx = resolve_context_for_visit_date(datetime(2022, 6, 1, tzinfo=timezone.utc))
    assert ctx["visit_year"] == 2022
    assert ctx.get("food_price_inflation_pct") is not None
    assert isinstance(ctx.get("events"), list)
