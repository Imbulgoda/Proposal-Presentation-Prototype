/** Centralized model-output display semantics for clinical UI. */

export type ModelDisplaySemantics = {
  model_mode: string;
  clinical_use: boolean;
  is_demo: boolean;
  score_kind: string;
  score_label: string;
  score_description: string;
  score_is_probability: boolean;
  score_is_calibrated: boolean;
  velocity_label: string;
  velocity_description: string;
  prediction_task: string;
  prediction_task_label: string;
  projection_version: string | null;
  projection_label: string;
  projection_description: string;
  confidence_label: string;
  confidence_is_calibrated: boolean;
  banner_title: string;
  banner_subtitle: string;
  report_disclaimer: string;
  alert_rule_note: string;
};

export const DEMO_DISPLAY_SEMANTICS: ModelDisplaySemantics = {
  model_mode: "demo",
  clinical_use: false,
  is_demo: true,
  score_kind: "demo_progression_score",
  score_label: "Demo Progression Score",
  score_description:
    "Synthetic demonstration output used to exercise the longitudinal monitoring workflow.",
  score_is_probability: false,
  score_is_calibrated: false,
  velocity_label: "Demo Score Velocity",
  velocity_description:
    "Visit-to-visit change in the synthetic demo score, adjusted for elapsed time. This demonstrates the longitudinal workflow and is not a clinically validated recovery metric.",
  prediction_task: "current_status_demo",
  prediction_task_label: "Current-status demonstration",
  projection_version: "demo-latent-projection-v1",
  projection_label: "Illustrative 2D Latent Projection",
  projection_description:
    "Synthetic 2D projection used to demonstrate the multi-visit trajectory interface. This is not PCA or UMAP and has no independent clinical meaning.",
  confidence_label: "Demo confidence indicator",
  confidence_is_calibrated: false,
  banner_title: "RESEARCH DEMO",
  banner_subtitle: "Synthetic model outputs · Not for clinical use",
  report_disclaimer: "RESEARCH DEMONSTRATION — Synthetic model outputs · Not for clinical use",
  alert_rule_note: "Generated from synthetic demonstration score",
};

export const RESEARCH_DISPLAY_SEMANTICS: ModelDisplaySemantics = {
  model_mode: "research",
  clinical_use: false,
  is_demo: false,
  score_kind: "research_model_score",
  score_label: "Model-Assessed Probability",
  score_description:
    "Research model output. Clinical review required. Not clinically validated for care decisions.",
  score_is_probability: true,
  score_is_calibrated: false,
  velocity_label: "Risk Velocity",
  velocity_description:
    "Visit-to-visit change in model-assessed probability adjusted for elapsed time. Clinical review required.",
  prediction_task: "current_status",
  prediction_task_label: "Current-status classification",
  projection_version: null,
  projection_label: "Model latent projection",
  projection_description: "2D projection of the model latent representation. Research visualization only.",
  confidence_label: "Model confidence",
  confidence_is_calibrated: false,
  banner_title: "RESEARCH MODEL",
  banner_subtitle: "Clinical review required",
  report_disclaimer: "RESEARCH MODEL — Clinical review required · Not clinically validated",
  alert_rule_note: "Research model alert rule",
};

type SemanticsSource = {
  display_semantics?: Partial<ModelDisplaySemantics> | null;
  model_is_demo?: boolean | null;
  model?: { is_demo?: boolean | null } | null;
  score_label?: string | null;
  probability_label?: string | null;
  velocity_label?: string | null;
};

/** Prefer backend display_semantics; fall back from is_demo flags. Never invent clinical validation. */
export function getModelOutputDisplayMetadata(source?: SemanticsSource | null): ModelDisplaySemantics {
  if (source?.display_semantics && source.display_semantics.score_label) {
    return { ...DEMO_DISPLAY_SEMANTICS, ...source.display_semantics } as ModelDisplaySemantics;
  }
  const demo = Boolean(source?.model_is_demo ?? source?.model?.is_demo ?? true);
  const base = demo ? DEMO_DISPLAY_SEMANTICS : RESEARCH_DISPLAY_SEMANTICS;
  return {
    ...base,
    score_label: source?.score_label ?? source?.probability_label ?? base.score_label,
    velocity_label: source?.velocity_label ?? base.velocity_label,
  };
}
