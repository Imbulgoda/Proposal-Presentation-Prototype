// Simulated Sri Lanka-specific feasibility rules for prototype demonstration only. These values are not official clinical eligibility decisions.

export const feasibilityWeights = {
  affordability: 0.20,
  localAvailability: 0.15,
  ageSuitability: 0.20,
  clinicAccess: 0.15,
  programmeEligibility: 0.10,
  householdPracticality: 0.10,
  clinicalSuitability: 0.10,
};

export const rejectedCounterfactualExamples = [
  {
    id: 'reject-household-resource',
    candidate: 'Change household resource level',
    featureName: 'Household Resource Level',
    currentValue: 'Low',
    targetValue: 'High',
    failedRule: 'Immutable / constrained feature protection',
    reason: 'Household economic status is a contextual constraint and must not be directly changed by the intervention engine.',
    constraintType: 'Hard constraint',
    suggestedAlternative: 'Use lower-cost locally available intervention options within the recorded household context.',
    decision: 'REJECTED',
  },
  {
    id: 'reject-district-change',
    candidate: 'Change child district',
    featureName: 'District',
    currentValue: 'Kandy',
    targetValue: 'Colombo',
    failedRule: 'Protected contextual feature',
    reason: 'District is a protected contextual feature and cannot be modified.',
    constraintType: 'Hard constraint',
    suggestedAlternative: 'Adapt the candidate to foods, clinics and programmes available in the child’s current district.',
    decision: 'REJECTED',
  },
];

const dietFeatures = new Set([
  'Dietary Diversity',
  'Food Group Variety',
  'Meal Frequency',
  'Complementary Feeding Practice',
  'Responsive Feeding Practice',
]);

const washFeatures = new Set(['Sanitation Practice', 'Safe Water Practice', 'Handwashing Practice']);

const protectedContextFeatures = new Set([
  'Age', 'Sex', 'District', 'Birth History', 'Household Resource Level',
  'Household Income Context', 'Household Wealth', 'Household Income',
]);

export function validateProtectedFeatureChanges(candidate) {
  const violations = (candidate?.changes || []).filter((change) =>
    protectedContextFeatures.has(change.featureName)
  );
  return {
    id: 'protected-feature-validation',
    name: 'Protected Feature Validation',
    category: 'Protected Feature Guardrail',
    description: 'Rejects counterfactuals that attempt to modify immutable or constrained context features.',
    result: violations.length === 0,
    score: violations.length === 0 ? 100 : 0,
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    constraintType: 'Hard constraint',
    reason: violations.length === 0
      ? 'No protected or constrained context feature is modified.'
      : `${violations.map((change) => change.featureName).join(', ')} cannot be directly modified by the intervention engine.`,
    suggestedAlternative: 'Generate a pathway using only directly actionable feeding, follow-up, counselling, or selected WASH factors.',
    violations,
  };
}

function statusForScore(score, { review = false, failBelow = 40, cautionBelow = 60 } = {}) {
  if (review) return 'REQUIRES REVIEW';
  if (score < failBelow) return 'FAIL';
  if (score < cautionBelow) return 'CAUTION';
  return 'PASS';
}

function rule({ id, name, category, description, score, reason, constraintType, suggestedAlternative, review = false }) {
  const status = statusForScore(score, { review });
  return {
    id,
    name,
    category,
    description,
    result: status === 'PASS' || status === 'REQUIRES REVIEW',
    score,
    reason,
    status,
    constraintType,
    suggestedAlternative,
  };
}

function hasAnyChange(candidate, names) {
  return candidate.changes.some((change) => names.has(change.featureName));
}

function affordabilityRule(child, candidate) {
  const context = child.feasibilityContext;
  const dietRelated = hasAnyChange(candidate, dietFeatures);
  const base = candidate.affordabilityAdapted && dietRelated
    ? 85
    : ({ Good: 94, Moderate: 78, Limited: dietRelated ? 58 : 76 }[context.foodAffordability] || 70);
  const score = Math.max(0, base - (dietRelated && context.householdResourceLevel === 'Low' ? 3 : 0));
  return rule({
    id: 'affordability',
    name: 'Affordability',
    category: 'Affordability',
    description: 'Checks whether the proposed intervention is affordable for the child’s household context.',
    score,
    reason: candidate.affordabilityAdapted && dietRelated
      ? 'The candidate is explicitly mapped to affordable locally available options in this simulated pathway.'
      : dietRelated && context.foodAffordability === 'Limited'
      ? 'Diet-related changes require lower-cost locally available options under the simulated household resource context.'
      : 'The proposed changes appear manageable within the simulated household affordability context.',
    constraintType: 'Soft constraint',
    suggestedAlternative: 'Use lower-cost locally available food diversity options and programme support where eligible.',
  });
}

function availabilityRule(child, candidate) {
  const context = child.feasibilityContext;
  const locationSensitive = hasAnyChange(candidate, new Set([...dietFeatures, ...washFeatures]));
  const base = { High: 94, Moderate: 74, Limited: locationSensitive ? 52 : 72 }[context.localFoodAvailability] || 68;
  return rule({
    id: 'local-availability',
    name: 'Local Availability',
    category: 'Local Availability',
    description: 'Checks whether recommended food or service options are realistically accessible in the child’s district.',
    score: base,
    reason: base < 60
      ? 'Some proposed inputs may have limited availability in the simulated district context.'
      : 'The candidate can be mapped to options represented as locally available in this prototype.',
    constraintType: 'Soft constraint',
    suggestedAlternative: 'Substitute equivalent foods or services that are more consistently available in the district.',
  });
}

function ageRule(child, candidate) {
  const feedingRelated = hasAnyChange(candidate, dietFeatures);
  const unsafe = feedingRelated && child.ageMonths < 6;
  return rule({
    id: 'age-suitability',
    name: 'Age Suitability',
    category: 'Age Suitability',
    description: 'Checks whether the feeding-related intervention is appropriate for the child’s age.',
    score: unsafe ? 20 : 96,
    reason: unsafe
      ? 'The feeding change is not represented as age suitable in this prototype scenario.'
      : `The proposed changes can be adapted for a child aged ${child.ageMonths} months, subject to professional review.`,
    constraintType: 'Hard constraint',
    suggestedAlternative: 'Use an age-appropriate pathway confirmed by a qualified nutrition professional.',
  });
}

function clinicRule(child, candidate) {
  const followUpChange = candidate.changes.some((change) => change.featureName === 'Clinic Follow-up');
  const access = child.feasibilityContext.clinicAccess;
  const score = followUpChange
    ? ({ Good: 95, Moderate: 76, Limited: 58, Difficult: 48 }[access] || 65)
    : 86;
  return rule({
    id: 'clinic-access',
    name: 'Clinic Access',
    category: 'Clinic Access',
    description: 'Checks whether clinic follow-up is realistic given access conditions.',
    score,
    reason: followUpChange && score < 60
      ? `Regular follow-up may be difficult because clinic access is marked as ${access.toLowerCase()}.`
      : followUpChange
        ? `Regular follow-up is considered practical because clinic access is marked as ${access.toLowerCase()}.`
        : 'This candidate does not depend strongly on additional clinic visits.',
    constraintType: 'Soft constraint',
    suggestedAlternative: 'Coordinate outreach, a nearer clinic, or a less travel-intensive follow-up schedule.',
  });
}

function programmeRule(child, candidate) {
  const eligible = child.feasibilityContext.programmeEligibility;
  const referralRelevant = child.riskLevel === 'High' || candidate.changes.some((change) => change.featureName === 'Clinic Follow-up');
  const score = eligible ? 100 : referralRelevant ? 30 : 78;
  return rule({
    id: 'programme-eligibility',
    name: 'Programme Eligibility',
    category: 'Programme Eligibility',
    description: 'Checks simulated eligibility for nutrition support or supplementary feeding referral.',
    score,
    reason: eligible
      ? 'The child is marked eligible for nutrition programme referral in the simulated prototype.'
      : 'Programme eligibility is not confirmed in the simulated child context and requires an alternative pathway.',
    constraintType: referralRelevant ? 'Hard constraint' : 'Soft constraint',
    suggestedAlternative: 'Request professional eligibility review or use a clinic-led counselling pathway not dependent on programme enrolment.',
  });
}

function householdRule(child, candidate) {
  const caregiver = child.feasibilityContext.caregiverAvailability;
  const base = { Good: 92, High: 92, Moderate: 76, Limited: 54 }[caregiver] || 68;
  const score = Math.max(35, base - (candidate.changes.length > 1 ? 5 : 0));
  return rule({
    id: 'household-practicality',
    name: 'Household Practicality',
    category: 'Household Context',
    description: 'Checks caregiver capacity and the practical effort needed to implement the candidate.',
    score,
    reason: score < 60
      ? 'The proposed changes may be difficult under the simulated caregiver availability context.'
      : 'The number and type of changes appear practically manageable in the simulated household context.',
    constraintType: 'Soft constraint',
    suggestedAlternative: 'Reduce the number of simultaneous changes or provide staged caregiver support.',
  });
}

function clinicalRule(child) {
  const score = child.severity === 'Severe' ? 72 : 84;
  return rule({
    id: 'clinical-suitability',
    name: 'Clinical Suitability',
    category: 'Clinical Suitability',
    description: 'Flags recommendations that require healthcare professional review.',
    score,
    reason: 'Healthcare professional confirmation is required before any candidate becomes a decision-support recommendation.',
    constraintType: 'Hard constraint',
    suggestedAlternative: 'Confirm anthropometry, clinical status and safeguarding considerations with a qualified professional.',
    review: true,
  });
}

export function feasibilityBand(score) {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Low';
  return 'Very Low';
}

export function mapChangeToIntervention(change) {
  const actions = {
    'Dietary Diversity': 'Improve age-appropriate dietary diversity using affordable locally available food options.',
    'Food Group Variety': 'Support a broader age-appropriate mix of locally available food groups.',
    'Meal Frequency': 'Review age-appropriate meal frequency with the caregiver and nutrition professional.',
    'Clinic Follow-up': 'Schedule regular child growth monitoring and nutrition follow-up.',
    'Sanitation Practice': 'Provide practical household WASH guidance and referral where needed.',
    'Safe Water Practice': 'Provide practical safe-water handling guidance suitable for the household context.',
    'Handwashing Practice': 'Reinforce practical handwashing support through caregiver counselling.',
    'Nutrition Awareness': 'Arrange accessible nutrition counselling for the caregiver.',
    'Nutrition Counselling': 'Schedule a caregiver nutrition counselling session.',
    'Complementary Feeding Practice': 'Review age-appropriate complementary feeding with a qualified professional.',
    'Responsive Feeding Practice': 'Support responsive feeding practice through caregiver counselling.',
  };
  return actions[change.featureName] || `Review a feasible improvement pathway for ${change.featureName.toLowerCase()}.`;
}

export function evaluateCandidateFeasibility(child, candidate) {
  const guardrailValidation = validateProtectedFeatureChanges(candidate);
  const rules = [
    affordabilityRule(child, candidate),
    availabilityRule(child, candidate),
    ageRule(child, candidate),
    clinicRule(child, candidate),
    programmeRule(child, candidate),
    householdRule(child, candidate),
    clinicalRule(child),
  ];
  const scoreById = Object.fromEntries(rules.map((item) => [item.id, item.score]));
  const overallFeasibilityScore = Math.round(
    scoreById.affordability * feasibilityWeights.affordability +
    scoreById['local-availability'] * feasibilityWeights.localAvailability +
    scoreById['age-suitability'] * feasibilityWeights.ageSuitability +
    scoreById['clinic-access'] * feasibilityWeights.clinicAccess +
    scoreById['programme-eligibility'] * feasibilityWeights.programmeEligibility +
    scoreById['household-practicality'] * feasibilityWeights.householdPracticality +
    scoreById['clinical-suitability'] * feasibilityWeights.clinicalSuitability
  );
  const hardFailures = [
    ...rules.filter((item) => item.constraintType === 'Hard constraint' && item.status === 'FAIL'),
    ...(guardrailValidation.status === 'FAIL' ? [guardrailValidation] : []),
  ];
  const cautions = rules.filter((item) => item.status === 'CAUTION');
  const requiresReview = rules.some((item) => item.status === 'REQUIRES REVIEW');
  let decision = 'FEASIBLE';
  if (hardFailures.length || overallFeasibilityScore < 40) decision = 'REJECTED';
  else if (cautions.length || overallFeasibilityScore < 80) decision = 'FEASIBLE WITH CAUTION';
  else if (requiresReview) decision = 'FEASIBLE WITH CLINICAL REVIEW';

  const reasons = rules
    .filter((item) => item.status !== 'PASS')
    .map((item) => item.reason);
  if (guardrailValidation.status === 'FAIL') reasons.unshift(guardrailValidation.reason);

  return {
    candidate,
    rules,
    overallFeasibilityScore,
    feasibilityLevel: feasibilityBand(overallFeasibilityScore),
    decision,
    hardConstraintStatus: hardFailures.length ? 'Fail' : 'Pass',
    clinicalReview: requiresReview ? 'Required' : 'Not required',
    cautions,
    hardFailures,
    guardrailValidation,
    reasons,
    mappedInterventions: candidate.changes.map((change) => ({
      change,
      action: mapChangeToIntervention(change),
    })),
  };
}

export function evaluateCandidateSet(child, candidates = []) {
  return candidates
    .map((candidate) => evaluateCandidateFeasibility(child, candidate))
    .sort((a, b) =>
      b.overallFeasibilityScore - a.overallFeasibilityScore ||
      b.candidate.riskReduction - a.candidate.riskReduction
    )
    .map((evaluation, index) => ({ ...evaluation, feasibilityRank: index + 1 }));
}
