# Component 04 — Panel Questions and Answers

## Why does CH-001 show all candidates?

The generation page deliberately shows five **possible what-if pathways before feasibility filtering**. They are not all recommendations. The next stage classifies them: three are eligible for ranking, one is retained as feasible with caution, and one is rejected by the protected-feature guardrail.

## Why generate more than one counterfactual?

One mathematical alternative may be unaffordable, unavailable, difficult to access, or unsuitable for the household. Multiple pathways let the prototype compare minimal change, diversity, plausibility, and local feasibility before choosing a decision-support option.

## Are Wachter, DiCE, and FACE really running?

No. This frontend uses deterministic, method-inspired simulations to demonstrate how their different objectives could be compared. The interface states this explicitly; no canonical Python counterfactual library or trained model runs in the browser.

## Does a lower counterfactual probability prove the intervention works?

No. It is a simulated model-estimated what-if difference, not causal or clinical evidence. A large difference can still be rejected when the proposed change is unrealistic or protected.

## What prevents unrealistic recommendations?

A reusable protected-feature validator rejects direct changes to immutable or constrained context, including district and household resource level. Feasibility rules then evaluate affordability, availability, age suitability, clinic access, programme eligibility, household practicality, and clinical suitability.

## Why is the household-resource option visible if it is wrong?

It is an intentional guardrail test. Keeping it visible makes the safety behavior auditable: despite its large 42 percentage-point estimated difference, it is rejected and cannot enter automatic ranking.

## Why is the caution candidate not ranked?

The strict handoff admits only **FEASIBLE** and **FEASIBLE WITH CLINICAL REVIEW** candidates. A caution candidate remains visible for transparency and possible professional reconsideration, but is not automatically promoted into the plan.

## How is feasibility calculated?

The weighted prototype formula is 20% affordability, 15% local availability, 20% age suitability, 15% clinic access, 10% programme eligibility, 10% household practicality, and 10% clinical suitability. Any hard failure overrides the numeric score and produces rejection.

## How is ranking calculated?

The score uses 30% normalized estimated risk difference, 30% feasibility, 15% proximity, 10% sparsity preference, 10% practicality, and 5% clinical readiness. This avoids choosing an intervention only because it produces the lowest estimated probability.

## What is the CH-001 result?

CH-001 starts at 87% simulated high risk. Five options are generated, three are strictly eligible, and the top option is the DiCE-inspired dietary-diversity plus clinic-follow-up pathway. It estimates 58% counterfactual risk, a 29 percentage-point difference, 86/100 feasibility, and 87/100 ranking.

## Are the weights clinically validated?

No. They are transparent prototype assumptions chosen for demonstration and must be validated with Sri Lankan clinical, nutrition, public-health, and programme experts before operational use.

## Does this replace a healthcare professional?

No. It is clinical decision support. The plan, review controls, and PDF all state that outputs are simulated and require professional assessment.

## What data is stored?

None by a backend in this phase. Child examples are local simulated data; notes and review states exist only in the current page session.

## What would production readiness require?

Validated prediction integration, approved local feasibility data and rules, authentication and role controls, secure persistence, auditability, uncertainty and fairness testing, professional governance, and prospective workflow evaluation.
