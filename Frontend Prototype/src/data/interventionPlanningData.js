import { mapChangeToIntervention } from './feasibilityData.js';

// Simulated research-prototype ranking logic. These values are not clinical treatment or efficacy scores.
export const interventionRankingWeights = {
  estimatedRiskReduction: 0.30,
  feasibilityScore: 0.30,
  proximity: 0.15,
  sparsityPreference: 0.10,
  practicality: 0.10,
  clinicalReadiness: 0.05,
};

export const supportingInterventionActions = {
  'Dietary Diversity': 'Improve age-appropriate dietary diversity using affordable locally available foods.',
  'Food Group Variety': 'Support a broader age-appropriate mix of affordable locally available food groups.',
  'Meal Frequency': 'Review age-appropriate meal frequency with a qualified nutrition professional.',
  'Clinic Follow-up': 'Schedule regular child growth monitoring and nutrition follow-up.',
  'Sanitation Practice': 'Provide practical household WASH guidance and service referral where needed.',
  'Safe Water Practice': 'Provide practical safe-water handling guidance suitable for the household context.',
  'Handwashing Practice': 'Reinforce practical handwashing support through caregiver counselling.',
  'Nutrition Awareness': 'Provide caregiver nutrition counselling and age-appropriate feeding guidance.',
  'Nutrition Counselling': 'Provide caregiver nutrition counselling and age-appropriate feeding guidance.',
  'Programme Eligibility': 'Review eligibility for available nutrition support programmes and refer where appropriate.',
  'Complementary Feeding Practice': 'Review age-appropriate complementary feeding with a qualified nutrition professional.',
  'Responsive Feeding Practice': 'Support responsive feeding practice through caregiver counselling.',
};

export function interventionActionForChange(change) {
  return supportingInterventionActions[change.featureName] || mapChangeToIntervention(change);
}

const interventionPriority = {
  'Dietary Diversity': 1,
  'Food Group Variety': 1,
  'Meal Frequency': 1,
  'Complementary Feeding Practice': 1,
  'Responsive Feeding Practice': 1,
  'Nutrition Awareness': 2,
  'Nutrition Counselling': 2,
  'Clinic Follow-up': 3,
  'Sanitation Practice': 4,
  'Safe Water Practice': 4,
  'Handwashing Practice': 4,
};

function ruleScore(evaluation, id, fallback = 70) {
  return evaluation.rules.find((rule) => rule.id === id)?.score ?? fallback;
}

export function calculateInterventionRanking(evaluation, maximumRiskReduction = 0.35) {
  const candidate = evaluation.candidate;
  const riskReductionNormalized = Math.min(1, candidate.riskReduction / Math.max(maximumRiskReduction, 0.01));
  const feasibilityScoreNormalized = evaluation.overallFeasibilityScore / 100;
  const proximity = candidate.proximity;
  const sparsityPreference = ({ 1: 1, 2: 0.8, 3: 0.6 })[candidate.sparsity] || 0.4;
  const practicality = ruleScore(evaluation, 'household-practicality') / 100;
  const clinicalReadiness = evaluation.hardFailures.length === 0
    ? (evaluation.clinicalReview === 'Required' ? 0.75 : 1)
    : 0;

  const rawScore =
    riskReductionNormalized * interventionRankingWeights.estimatedRiskReduction +
    feasibilityScoreNormalized * interventionRankingWeights.feasibilityScore +
    proximity * interventionRankingWeights.proximity +
    sparsityPreference * interventionRankingWeights.sparsityPreference +
    practicality * interventionRankingWeights.practicality +
    clinicalReadiness * interventionRankingWeights.clinicalReadiness;

  return {
    ...evaluation,
    rankingMetrics: {
      riskReductionNormalized,
      feasibilityScoreNormalized,
      proximity,
      sparsityPreference,
      practicality,
      clinicalReadiness,
    },
    practicalityLabel: practicality >= 0.8 ? 'High' : practicality >= 0.6 ? 'Medium' : 'Low',
    prototypeRankingScore: Math.round(rawScore * 100),
    interventionActions: [...candidate.changes]
      .sort((a, b) => (interventionPriority[a.featureName] || 9) - (interventionPriority[b.featureName] || 9))
      .map(interventionActionForChange),
  };
}

export function rankInterventionCandidates(evaluations = []) {
  const eligible = evaluations.filter((evaluation) =>
    ['FEASIBLE', 'FEASIBLE WITH CLINICAL REVIEW'].includes(evaluation.decision)
  );
  const maximumRiskReduction = Math.max(
    0.01,
    ...eligible.map((evaluation) => evaluation.candidate.riskReduction)
  );

  return eligible
    .map((evaluation) => calculateInterventionRanking(evaluation, maximumRiskReduction))
    .sort((a, b) =>
      b.prototypeRankingScore - a.prototypeRankingScore ||
      b.overallFeasibilityScore - a.overallFeasibilityScore ||
      b.candidate.riskReduction - a.candidate.riskReduction
    )
    .map((evaluation, index) => ({ ...evaluation, interventionRank: index + 1 }));
}

export function rankingExplanation(rankedCandidate) {
  if (!rankedCandidate) return '';
  const changeText = rankedCandidate.candidate.changes.length === 1
    ? 'only one actionable feature change'
    : `only ${rankedCandidate.candidate.changes.length} actionable feature changes`;
  return `This candidate was ranked highest because it combines a strong model-estimated risk difference with ${rankedCandidate.feasibilityLevel.toLowerCase()} feasibility and ${changeText}.`;
}

export function planIdForChild(childId) {
  return `INT-${String(childId).replace('-', '')}-001`;
}
