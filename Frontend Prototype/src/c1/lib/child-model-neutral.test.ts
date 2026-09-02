import { describe, expect, it } from "vitest";
import {
  CHILD_MODEL_NEUTRAL,
  riskAccentColor,
  riskGlowOpacity,
  riskRingProgress,
} from "../components/child-model/ChildModel";

describe("child progress figure semantics", () => {
  it("uses neutral slate when neutral mode is enabled", () => {
    expect(CHILD_MODEL_NEUTRAL).toBe(false);
    expect(riskAccentColor(0.9, true)).toBe("#94a3b8");
    expect(riskGlowOpacity(0.9, true)).toBeLessThan(0.25);
  });

  it("maps higher risk to warmer accent colours without geometry changes", () => {
    expect(riskAccentColor(0.1)).toBe("#047857");
    expect(riskAccentColor(0.9)).toBe("#dc2626");
    expect(riskRingProgress(0.2)).toBeLessThan(riskRingProgress(0.8));
  });
});
