import { describe, expect, it } from "vitest";
import {
  DEMO_DISPLAY_SEMANTICS,
  getModelOutputDisplayMetadata,
  RESEARCH_DISPLAY_SEMANTICS,
} from "./model-display";

describe("model display semantics", () => {
  it("labels demo scalar as Demo Progression Score, not probability", () => {
    const meta = getModelOutputDisplayMetadata({ model_is_demo: true });
    expect(meta.score_label).toBe("Demo Progression Score");
    expect(meta.score_is_probability).toBe(false);
    expect(meta.score_kind).toBe("demo_progression_score");
    expect(meta.velocity_label).toBe("Demo Score Velocity");
    expect(meta.prediction_task_label).toMatch(/Current-status demonstration/i);
    expect(meta.banner_subtitle).toMatch(/Not for clinical use/i);
    expect(meta.projection_version).toBe("demo-latent-projection-v1");
    expect(meta.projection_label).toMatch(/Illustrative 2D Latent Projection/);
    expect(meta.clinical_use).toBe(false);
  });

  it("does not auto-claim clinical validation for research modes", () => {
    const meta = getModelOutputDisplayMetadata({ model_is_demo: false });
    expect(meta.clinical_use).toBe(false);
    expect(meta.banner_title).toBe("RESEARCH MODEL");
    expect(meta.score_label).not.toMatch(/Demo Progression Score/);
    expect(meta.prediction_task_label).toMatch(/Current-status classification/i);
  });

  it("prefers backend display_semantics when present", () => {
    const meta = getModelOutputDisplayMetadata({
      model_is_demo: false,
      display_semantics: {
        ...RESEARCH_DISPLAY_SEMANTICS,
        score_label: "Calibrated Malnutrition Probability",
        score_is_probability: true,
        score_is_calibrated: true,
      },
    });
    expect(meta.score_label).toBe("Calibrated Malnutrition Probability");
    expect(meta.score_is_calibrated).toBe(true);
  });

  it("exports stable demo defaults for UI fallback", () => {
    expect(DEMO_DISPLAY_SEMANTICS.report_disclaimer).toMatch(/Not for clinical use/i);
  });
});
