"""Authoritative model-output display semantics for clinical UI.

Display labels must follow active inference semantics — never hard-code demo
terminology into domain tables. Future calibrated models switch labels here.
"""

from __future__ import annotations

from app.core.config import get_settings

DEMO_PROJECTION_VERSION = "demo-latent-projection-v1"


def is_demo_mode(*, model_mode: str | None = None, is_demo: bool | None = None) -> bool:
    mode = (model_mode if model_mode is not None else get_settings().model_mode).lower()
    if is_demo is True:
        return True
    if is_demo is False and mode != "demo":
        return False
    return mode == "demo" or is_demo is True


def get_model_output_display_metadata(
    *,
    model_mode: str | None = None,
    is_demo: bool | None = None,
) -> dict:
    """Return UI-facing semantics for the active model output.

    Absence of DEMO must never imply clinical validation.
    """
    settings = get_settings()
    mode = (model_mode if model_mode is not None else settings.model_mode).lower()
    demo = is_demo_mode(model_mode=mode, is_demo=is_demo)

    if demo:
        return {
            "model_mode": "demo",
            "clinical_use": False,
            "is_demo": True,
            "score_kind": "demo_progression_score",
            "score_label": "Demo Progression Score",
            "score_description": (
                "Synthetic demonstration output used to exercise the longitudinal monitoring workflow."
            ),
            "score_is_probability": False,
            "score_is_calibrated": False,
            "velocity_label": "Demo Score Velocity",
            "velocity_description": (
                "Visit-to-visit change in the synthetic demo score, adjusted for elapsed time. "
                "This demonstrates the longitudinal workflow and is not a clinically validated recovery metric."
            ),
            "prediction_task": "current_status_demo",
            "prediction_task_label": "Current-status demonstration",
            "projection_version": DEMO_PROJECTION_VERSION,
            "projection_label": "Illustrative 2D Latent Projection",
            "projection_description": (
                "Synthetic 2D projection used to demonstrate the multi-visit trajectory interface. "
                "This is not PCA or UMAP and has no independent clinical meaning."
            ),
            "confidence_label": "Demo confidence indicator",
            "confidence_is_calibrated": False,
            "banner_title": "RESEARCH DEMO",
            "banner_subtitle": "Synthetic model outputs · Not for clinical use",
            "report_disclaimer": "RESEARCH DEMONSTRATION — Synthetic model outputs · Not for clinical use",
            "alert_rule_note": "Generated from synthetic demonstration score",
        }

    # Research / non-demo adapters — still not clinically validated unless separately attested.
    return {
        "model_mode": mode,
        "clinical_use": False,
        "is_demo": False,
        "score_kind": "research_model_score",
        "score_label": "Model-Assessed Probability",
        "score_description": (
            "Research model output. Clinical review required. Not clinically validated for care decisions."
        ),
        "score_is_probability": True,
        "score_is_calibrated": False,
        "velocity_label": "Risk Velocity",
        "velocity_description": (
            "Visit-to-visit change in model-assessed probability adjusted for elapsed time. "
            "Clinical review required."
        ),
        "prediction_task": "current_status",
        "prediction_task_label": "Current-status classification",
        "projection_version": None,
        "projection_label": "Model latent projection",
        "projection_description": (
            "2D projection of the model latent representation. Research visualization only."
        ),
        "confidence_label": "Model confidence",
        "confidence_is_calibrated": False,
        "banner_title": "RESEARCH MODEL",
        "banner_subtitle": "Clinical review required",
        "report_disclaimer": "RESEARCH MODEL — Clinical review required · Not clinically validated",
        "alert_rule_note": "Research model alert rule",
    }
