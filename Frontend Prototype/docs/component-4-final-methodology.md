# Component 04 — Final Prototype Methodology

## 1. Research purpose

Component 04 is the **Feasible Personalized Counterfactual Intervention Engine** for personalized childhood malnutrition intervention in Sri Lanka. It converts a simulated child-level prediction and explainable factors into alternative what-if intervention options, removes infeasible options, ranks the eligible set, and presents a healthcare-worker decision-support plan.

## 2. Scope

This delivery is a frontend research prototype. Data, probabilities, explainability impacts, counterfactual estimates, feasibility values, and review states are deterministic simulated values. No backend, database, authentication service, trained model, live clinical integration, or canonical counterfactual library is connected.

## 3. Input contract

The prototype expects a child identifier, condition, predicted risk level, prediction probability, explainable risk factors, actionable flags, and a feasibility context. In the full architecture these values come from the detection component. Component 04 consumes them; it does not calculate the original malnutrition prediction.

## 4. Workflow

1. Select a simulated child record.
2. Review prediction and explainability inputs.
3. Select actionable factors.
4. Generate five deterministic counterfactual intervention options.
5. Apply Sri Lanka-specific prototype feasibility rules and protected-feature guardrails.
6. Pass only strict eligible candidates to intervention ranking.
7. Create a personalized intervention card and downloadable PDF for professional review.

## 5. Counterfactual method comparison

- **Wachter-inspired:** seeks a nearby valid state using few feature modifications.
- **DiCE-inspired:** produces diverse alternative pathways while respecting selected constraints.
- **FACE-inspired:** emphasizes plausible, realistic combinations.

These are method-inspired simulations for research demonstration. The browser is not executing the official Wachter, DiCE, or FACE implementations.

## 6. Why multiple options are displayed

Counterfactual generation answers “what alternative pathways can be proposed?” and therefore shows five candidates before feasibility filtering. They are not five approved recommendations. For CH-001, three proceed to ranking, one remains visible as **FEASIBLE WITH CAUTION**, and one is **REJECTED** to demonstrate the protected-feature guardrail.

## 7. Counterfactual metrics

- **Prototype Validity:** whether the proposed state reaches its selected prediction target. Method comparison validity rate is valid options divided by total generated options.
- **Prototype Proximity:** closeness to the original child profile, represented as `1 − normalized feature distance`.
- **Sparsity / Feature Changes:** number of changed actionable features. The ranking preference is 1.0 for one change, 0.8 for two, 0.6 for three, and 0.4 for four or more.
- **Prototype Diversity Score:** difference among alternative pathways in the generated option set.
- **Estimated Risk Difference:** original prediction probability minus estimated counterfactual probability, reported in percentage points.

These metrics describe simulated what-if outputs. They do not establish causality or clinical efficacy.

## 8. Protected-feature guardrail

The reusable validator rejects candidates that directly modify immutable or constrained context such as age, sex, district, birth history, household resource level, household income context, household wealth, or household income. A rejected candidate includes the failed rule, reason, hard-constraint label, and a safer alternative based on actionable factors.

## 9. Feasibility criteria and weights

The Prototype Feasibility Score is:

`0.20 affordability + 0.15 local availability + 0.20 age suitability + 0.15 clinic access + 0.10 programme eligibility + 0.10 household practicality + 0.10 clinical suitability`

The weights are transparent prototype assumptions for research demonstration and require domain-expert validation before real use.

## 10. Feasibility decisions

- **REJECTED:** any hard-constraint failure or overall score below 40.
- **FEASIBLE WITH CAUTION:** no hard failure, but a caution exists or the score is below 80.
- **FEASIBLE WITH CLINICAL REVIEW:** score at least 80, no hard failure, and professional review is required.
- **FEASIBLE:** score at least 80 with no hard failure or review flag.

Only **FEASIBLE** and **FEASIBLE WITH CLINICAL REVIEW** candidates are automatically handed to ranking. Caution candidates remain visible for transparency but are not auto-ranked.

## 11. Intervention ranking formula

The Prototype Ranking Score is:

`0.30 normalized estimated risk difference + 0.30 feasibility + 0.15 proximity + 0.10 sparsity preference + 0.10 practicality + 0.05 clinical readiness`

Estimated risk difference is normalized against the largest eligible candidate for the selected child. The resulting score prioritizes balanced, feasible options rather than simply selecting the lowest estimated counterfactual probability.

## 12. CH-001 deterministic example

The original simulated prediction is **87% high risk**. Five options are generated:

1. DiCE: dietary diversity plus clinic follow-up, estimated 58% risk, 29 percentage-point difference.
2. FACE: dietary diversity plus sanitation practice, estimated 62% risk, 25 percentage-point difference.
3. Wachter: clinic follow-up, estimated 72% risk, 15 percentage-point difference.
4. Wachter: dietary diversity, estimated 68% risk, 19 percentage-point difference; feasible with caution.
5. DiCE guardrail example: household resource level Low to High, estimated 45% risk, 42 percentage-point difference; rejected.

The strict eligible ranking set contains three candidates. The top DiCE option has a **Prototype Feasibility Score of 86/100** and a **Prototype Ranking Score of 87/100**.

## 13. Rejection examples

- Household Resource Level: Low to High — rejected because economic context is constrained and cannot be directly changed by the engine.
- District: Kandy to Colombo — rejected because district is protected context, not an intervention action.

The intended alternative is to adapt food, service, referral, counselling, or WASH actions to the child’s existing context.

## 14. Personalized plan output

The plan contains the current situation, primary and supporting actions, feasibility summary, model-estimated before/after scenario, action timeline, alternative eligible options, prototype healthcare review state, and local notes. Review actions change frontend state only and are not official clinical approval.

## 15. PDF report

The browser-generated PDF contains report metadata, child and prediction inputs, modifiable factors, recommended decision-support actions, feasibility results, estimated counterfactual risk, estimated risk difference, prototype feasibility and ranking scores, professional review state, notes, and the research disclaimer.

## 16. Safety and interpretation

Component 04 is clinical decision support and does not replace healthcare professionals. Counterfactual values are simulated what-if estimates, not guaranteed outcomes. Feature importance is not causality. Every output must be verified against current anthropometry, clinical status, safeguarding needs, caregiver circumstances, and locally applicable guidance.

## 17. Limitations and next validation

The rule thresholds, local availability mappings, programme eligibility assumptions, weights, and intervention text need review by Sri Lankan nutrition and public-health experts. Future work should connect validated prediction outputs, approved local datasets and programme rules, user access controls, persistence and audit trails, uncertainty analysis, fairness testing, and prospective clinical workflow evaluation.
