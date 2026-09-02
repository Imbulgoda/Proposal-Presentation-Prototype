from types import SimpleNamespace

from app.models.enums import PredictionMode, Sex
from app.services.prediction_explanation import build_prediction_explanation


def _ns(**kwargs):
    return SimpleNamespace(**kwargs)


def test_explanation_mentions_low_dietary_diversity_and_weight():
    visit = _ns(
        anthropometry=_ns(age_months=18.0, weight_kg=8.0, height_cm=75.0),
        socioeconomic=_ns(
            maternal_age_years=24,
            maternal_education="primary",
            maternal_employment="home",
            income_category="low",
            household_size=6,
            remarks=None,
        ),
        dietary=_ns(
            exclusive_breastfeeding=False,
            breastfeeding_duration_months=4.0,
            complementary_feeding=True,
            meal_frequency=2,
            dietary_diversity_category="low",
            triposha_received=False,
            micronutrient_supplementation=False,
            remarks=None,
        ),
        maternal_child_health=None,
        context_snapshot=_ns(
            economy_stress_level="severe",
            food_price_inflation_pct=94.9,
            events=[{"label": "Economic crisis", "type": "economic"}],
        ),
    )
    child = _ns(pseudonymous_id="C-TEST")
    prediction = _ns(
        status_prediction="wasting",
        severity_prediction="moderate",
        primary_risk_score=0.61,
        mode=PredictionMode.DEMO,
    )
    model = _ns(is_demo=True)

    out = build_prediction_explanation(child=child, visit=visit, prediction=prediction, model=model)

    assert out["owner"] == "c1"
    assert out["is_shap"] is False
    assert "wasting" in out["headline"].lower()
    assert any("dietary diversity" in f["label"].lower() for f in out["factors"])
    assert any(f["modality"] == "external_context" for f in out["factors"])
    assert "not shap" in out["disclaimer"].lower()
