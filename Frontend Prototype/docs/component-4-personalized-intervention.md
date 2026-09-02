# Component 04 — Feasible Personalized Counterfactual Intervention Engine

## Purpose

Component 04 converts child-level malnutrition prediction outputs and explainable risk factors into feasible, personalized intervention pathways for healthcare workers.

## Prototype workflow

Prediction → Explainability → Actionability → Counterfactual Generation → Feasibility → Ranking → Personalized Intervention Plan → Healthcare Professional Review

The prototype compares three counterfactual approaches:

- Wachter — Baseline Counterfactual
- DiCE — Diverse Counterfactual Explanations
- FACE — Feasibility-Oriented Counterfactual

Sri Lanka-specific prototype rules assess affordability, local availability, age suitability, clinic access, programme eligibility, household practicality, and clinical review requirements.

## Current scope

This is a frontend-only research prototype using deterministic simulated data. Counterfactual risk changes are model-estimated what-if scenarios, not guaranteed clinical effects. Every intervention output requires healthcare professional review before any real-world decision.

## Main demo case

Use child `CH-001` to demonstrate the complete workflow from high predicted underweight risk through explainable factors, counterfactual generation, feasibility filtering, ranking, personalized planning, review, PDF download, and printing.
