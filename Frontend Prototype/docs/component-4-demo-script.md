# Component 04 — 2–3 Minute Demonstration Script

## 0:00–0:20 — Open Component 04

From Research Home, point out that Component 04 is active and open **Feasible Personalized Counterfactual Intervention**. State: “This frontend research prototype converts a child’s simulated malnutrition prediction and explainable factors into feasible decision-support options. It does not replace a healthcare professional.”

## 0:20–0:40 — Select CH-001

Open the Intervention Dashboard and select **CH-001**. On the child page, show the simulated 87% high-risk prediction, explainable factors, and actionable/context distinction. Clarify that Component 04 receives this prediction; it does not calculate it.

## 0:40–1:15 — Generate five alternatives

Open Counterfactual Generation, keep the actionable factors selected, and generate five options. Briefly compare the method-inspired objectives: Wachter for nearby minimal change, DiCE for diverse pathways, and FACE for plausibility. Say: “These five are candidates before feasibility checks, not five recommendations.”

Point to the option with the largest apparent difference—Household Resource Level, Low to High—and explain that it is deliberately unrealistic so the next step can demonstrate rejection.

## 1:15–1:50 — Demonstrate feasibility filtering

Open Feasibility Analysis. Show the seven weighted checks and the explicit formula. Highlight the final counts: five generated, three strict eligible, one caution, one rejected. Open the rejected option’s reason: it attempts to change a constrained context feature and fails the protected-feature hard guardrail. Emphasize that a lower estimated risk does not make an option feasible.

## 1:50–2:15 — Rank the eligible set

Continue to Intervention Ranking. Explain the formula: 30% normalized estimated risk difference, 30% feasibility, 15% proximity, 10% sparsity, 10% practicality, and 5% clinical readiness. Show that only three strict eligible candidates appear.

Open the top DiCE-inspired option: dietary diversity plus clinic follow-up, 87% to an estimated 58%, 29 percentage-point difference, feasibility 86/100, ranking 87/100.

## 2:15–2:45 — Review the personalized plan

Show the priority action, supporting actions, feasibility summary, model-estimated scenario, timeline, and alternatives. Change the prototype review state or add a short note, explaining that these controls are local frontend workflow states and not official approval.

## 2:45–3:00 — Export and close

Download the intervention PDF and mention that it includes inputs, actions, feasibility, estimated difference, prototype scores, review state, notes, and disclaimer. Close with: “The contribution is the transparent pipeline from prediction to multiple alternatives, protected-feature rejection, local feasibility filtering, balanced ranking, and professional decision support.”
