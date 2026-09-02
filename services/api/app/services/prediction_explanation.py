"""C1-native, plain-language prediction explanations from real visit inputs.

This is NOT SHAP or Component 2 explainability. It summarises which recorded
inputs most likely influenced the demo / research model output, using only data
present on the visit. Never invents features or attributions.
"""

from __future__ import annotations

from typing import Any

from app.models.intelligence import ModelVersion, Prediction
from app.models.paediatric import Child, Visit
from app.services.model_display import get_model_output_display_metadata


def _val(obj, name: str):
    if obj is None:
        return None
    v = getattr(obj, name, None)
    return v.value if hasattr(v, "value") else v


def _append_factor(
    factors: list[dict[str, Any]],
    *,
    label: str,
    detail: str,
    modality: str,
    direction: str,
    weight: int = 1,
) -> None:
    factors.append(
        {
            "label": label,
            "detail": detail,
            "modality": modality,
            "direction": direction,
            "weight": weight,
        }
    )


def build_prediction_explanation(
    *,
    child: Child,
    visit: Visit,
    prediction: Prediction,
    model: ModelVersion | None,
) -> dict[str, Any]:
    is_demo = bool(model.is_demo) if model else prediction.mode.value == "DEMO"
    semantics = get_model_output_display_metadata(is_demo=is_demo)
    factors: list[dict[str, Any]] = []
    limitations: list[str] = []

    anthro = visit.anthropometry
    socio = visit.socioeconomic
    diet = visit.dietary
    ctx = visit.context_snapshot

    age = _val(anthro, "age_months")
    weight = _val(anthro, "weight_kg")
    height = _val(anthro, "height_cm")

    if weight is not None and height is not None and float(height) > 0:
        bmi_like = float(weight) / ((float(height) / 100) ** 2)
        if bmi_like < 14:
            _append_factor(
                factors,
                label="Weight relative to height",
                detail=f"Recorded weight {weight} kg and height {height} cm suggest comparatively low weight-for-height for this age group.",
                modality="anthropometric",
                direction="increases_concern",
                weight=3,
            )
        elif bmi_like < 15.5:
            _append_factor(
                factors,
                label="Weight relative to height",
                detail=f"Weight {weight} kg and height {height} cm are below the range typically associated with lower nutritional risk in this demo model.",
                modality="anthropometric",
                direction="increases_concern",
                weight=2,
            )
        else:
            _append_factor(
                factors,
                label="Weight relative to height",
                detail=f"Weight {weight} kg and height {height} cm are within a range that lowers immediate wasting concern in this demo assessment.",
                modality="anthropometric",
                direction="decreases_concern",
                weight=1,
            )
    else:
        limitations.append("Anthropometric weight and/or height were not available for a full growth comparison.")

    if age is not None:
        _append_factor(
            factors,
            label="Child's age",
            detail=f"Age {age} months provides the growth context used when interpreting weight and height.",
            modality="anthropometric",
            direction="neutral",
            weight=1,
        )

    income = _val(socio, "income_category")
    if income == "low":
        _append_factor(
            factors,
            label="Income category",
            detail="Household income category was recorded as Low, which can be associated with higher nutritional vulnerability in the model.",
            modality="socioeconomic",
            direction="increases_concern",
            weight=2,
        )
    elif income in ("medium", "high"):
        _append_factor(
            factors,
            label="Income category",
            detail=f"Income category was recorded as {income.title()}, which may reduce socioeconomic nutritional risk in the model.",
            modality="socioeconomic",
            direction="decreases_concern",
            weight=1,
        )

    household = _val(socio, "household_size")
    if household is not None and int(household) >= 7:
        _append_factor(
            factors,
            label="Family member count",
            detail=f"{household} household members may increase resource pressure per child in the socioeconomic context.",
            modality="socioeconomic",
            direction="increases_concern",
            weight=1,
        )

    education = _val(socio, "maternal_education")
    if education in ("none", "primary"):
        _append_factor(
            factors,
            label="Education",
            detail=f"Maternal education was recorded as {education}, which the model may treat as a socioeconomic risk marker.",
            modality="socioeconomic",
            direction="increases_concern",
            weight=1,
        )

    mother_age = _val(socio, "maternal_age_years")
    if mother_age is not None and int(mother_age) < 20:
        _append_factor(
            factors,
            label="Mother's age",
            detail=f"Mother's age {mother_age} years was recorded; very young maternal age can contribute to contextual risk in the model.",
            modality="socioeconomic",
            direction="increases_concern",
            weight=1,
        )

    diversity = _val(diet, "dietary_diversity_category")
    if diversity == "low":
        _append_factor(
            factors,
            label="Dietary diversity (Low/Med/High)",
            detail="Dietary diversity was recorded as Low, indicating fewer food groups and higher dietary risk in the model.",
            modality="dietary",
            direction="increases_concern",
            weight=3,
        )
    elif diversity == "medium":
        _append_factor(
            factors,
            label="Dietary diversity (Low/Med/High)",
            detail="Dietary diversity was recorded as Medium — moderate dietary adequacy in the model.",
            modality="dietary",
            direction="neutral",
            weight=1,
        )
    elif diversity == "high":
        _append_factor(
            factors,
            label="Dietary diversity (Low/Med/High)",
            detail="Dietary diversity was recorded as High, which tends to lower dietary risk in the model.",
            modality="dietary",
            direction="decreases_concern",
            weight=2,
        )

    exclusive_bf = _val(diet, "exclusive_breastfeeding")
    if exclusive_bf is False:
        _append_factor(
            factors,
            label="Exclusive BF (Y/N)",
            detail="Exclusive breastfeeding was recorded as No, which may increase feeding-related concern for younger infants in the model.",
            modality="dietary",
            direction="increases_concern",
            weight=2,
        )
    elif exclusive_bf is True:
        _append_factor(
            factors,
            label="Exclusive BF (Y/N)",
            detail="Exclusive breastfeeding was recorded as Yes, which is generally protective in early infancy within this model.",
            modality="dietary",
            direction="decreases_concern",
            weight=2,
        )

    meals = _val(diet, "meal_frequency")
    if meals is not None and int(meals) < 3:
        _append_factor(
            factors,
            label="Meals/Day",
            detail=f"Only {meals} meal(s) per day were recorded, which may indicate insufficient meal frequency.",
            modality="dietary",
            direction="increases_concern",
            weight=2,
        )

    comp_feed = _val(diet, "complementary_feeding")
    if comp_feed is False and age is not None and float(age) >= 6:
        _append_factor(
            factors,
            label="Complementary feeding (Y/N)",
            detail="Complementary feeding was recorded as No after 6 months of age, which may increase dietary concern.",
            modality="dietary",
            direction="increases_concern",
            weight=2,
        )

    triposha = _val(diet, "triposha_received")
    if triposha is False:
        _append_factor(
            factors,
            label="Triposha (Y/N)",
            detail="Triposha supplementation was recorded as No.",
            modality="dietary",
            direction="increases_concern",
            weight=1,
        )

    vitamins = _val(diet, "micronutrient_supplementation")
    if vitamins is False:
        _append_factor(
            factors,
            label="Vitamin supplements (Y/N)",
            detail="Vitamin / micronutrient supplements were recorded as No.",
            modality="dietary",
            direction="increases_concern",
            weight=1,
        )

    if ctx is not None:
        stress = _val(ctx, "economy_stress_level")
        inflation = _val(ctx, "food_price_inflation_pct")
        if stress in ("severe", "elevated"):
            _append_factor(
                factors,
                label="Sri Lanka economic / food-price context",
                detail=(
                    f"Visit-year context shows {stress} economy stress"
                    + (f" with food price inflation around {inflation}%." if inflation is not None else ".")
                ),
                modality="external_context",
                direction="increases_concern",
                weight=2,
            )
        events = _val(ctx, "events") or []
        if events:
            labels = [str(e.get("label")) for e in events[:2] if isinstance(e, dict) and e.get("label")]
            if labels:
                _append_factor(
                    factors,
                    label="Disease / disaster context",
                    detail="; ".join(labels) + " (linked to visit year).",
                    modality="external_context",
                    direction="increases_concern",
                    weight=1,
                )

    status = prediction.status_prediction.replace("_", " ")
    severity = prediction.severity_prediction.replace("_", " ")
    score_pct = round(float(prediction.primary_risk_score) * 100)

    concern_sorted = sorted(
        factors,
        key=lambda f: (
            0 if f["direction"] == "increases_concern" else 1 if f["direction"] == "neutral" else 2,
            -f["weight"],
        ),
    )
    top_concerns = [f for f in concern_sorted if f["direction"] == "increases_concern"][:3]
    protective = [f for f in factors if f["direction"] == "decreases_concern"][:2]

    if top_concerns:
        reason_bits = [f["label"].lower() for f in top_concerns]
        headline = (
            f"The model suggests {status}"
            + (f" ({severity})" if severity and severity != "none" else "")
            + f" mainly because of: {', '.join(reason_bits)}."
        )
    else:
        headline = (
            f"The model suggests {status}"
            + (f" ({severity})" if severity and severity != "none" else "")
            + " based on the available measurements and household/dietary information recorded at this visit."
        )

    summary_parts = [
        f"At this visit the {semantics['score_label']} was {score_pct}% ({semantics['prediction_task_label'].lower()}).",
    ]
    if top_concerns:
        summary_parts.append(
            "The main inputs that increased model concern were: "
            + "; ".join(f"{f['label']} — {f['detail']}" for f in top_concerns[:2])
            + "."
        )
    if protective:
        summary_parts.append(
            "Inputs that tended to lower concern included: "
            + "; ".join(f"{f['label']}" for f in protective)
            + "."
        )
    if not top_concerns and not protective:
        summary_parts.append(
            "Limited structured inputs were available; the assessment relied primarily on anthropometry and the demo model rules."
        )

    modality_groups: dict[str, list[str]] = {}
    for f in factors:
        modality_groups.setdefault(f["modality"], []).append(f["label"])

    return {
        "owner": "c1",
        "kind": "input_based_summary",
        "is_shap": False,
        "headline": headline,
        "summary": " ".join(summary_parts),
        "assessment": {
            "status": prediction.status_prediction,
            "severity": prediction.severity_prediction,
            "score": float(prediction.primary_risk_score),
            "score_label": semantics["score_label"],
            "score_is_probability": semantics["score_is_probability"],
        },
        "factors": concern_sorted,
        "modality_highlights": [
            {"modality": k, "fields": v} for k, v in modality_groups.items()
        ],
        "limitations": limitations,
        "disclaimer": (
            f"{semantics['banner_subtitle']} This explanation describes recorded inputs that influenced the "
            f"{semantics['score_label'].lower()} in the demo rules — it is not SHAP, not causal proof, and not a treatment recommendation. "
            "Clinical review is required."
        ),
        "advanced_explainability_owner": "c2",
        "advanced_explainability_note": "Feature-attribution analysis (SHAP) and trust scoring are owned by Component 2 when connected.",
    }
