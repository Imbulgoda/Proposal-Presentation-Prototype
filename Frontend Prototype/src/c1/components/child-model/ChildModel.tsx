/** Visual semantics for the child progress figure (not anatomical imaging). */

export const CHILD_MODEL_NEUTRAL = false;

/** Risk affects accent colour/glow only — never geometry. */
export function riskAccentColor(risk: number, neutral = CHILD_MODEL_NEUTRAL): string {
  const k = Math.min(1, Math.max(0, risk));
  if (neutral) return "#94a3b8";
  if (k >= 0.7) return "#dc2626";
  if (k >= 0.45) return "#d97706";
  if (k >= 0.25) return "#2563eb";
  return "#047857";
}

export function riskGlowOpacity(risk: number, neutral = CHILD_MODEL_NEUTRAL): number {
  const k = Math.min(1, Math.max(0, risk));
  if (neutral) return 0.18;
  return 0.14 + k * 0.22;
}

export function riskRingProgress(risk: number): number {
  const k = Math.min(1, Math.max(0, risk));
  return 0.35 + k * 0.55;
}
