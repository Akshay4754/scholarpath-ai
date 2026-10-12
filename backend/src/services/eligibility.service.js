import { retrieveOfficialEvidence } from './retrieval.service.js';
import { explainEligibility } from './ai.service.js';
import { ALL_FIELDS, ALL_INDIA, GENDERS, SOCIAL_CATEGORIES, STATES, YEARS_OF_STUDY, EDUCATION_LEVELS, FIELDS_OF_STUDY } from '../data/profileOptions.js';

const blank = v => v === undefined || v === null || String(v).trim() === '';
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
const inList = (value, list = [], wildcard) => !blank(value) && list.some(x => (wildcard && same(x, wildcard)) || same(x, value));
const inr = n => `₹${Number(n).toLocaleString('en-IN')}`;
// Category-specific thresholds. When the category is unknown, use the most lenient value so nobody is wrongly excluded.
const forCategory = (overrides, category, fallback, mostLenient) => {
  if (!overrides) return fallback;
  if (!blank(category)) return overrides[category] ?? fallback;
  return mostLenient([fallback, ...Object.values(overrides)].filter(v => v !== null && v !== undefined));
};

// Pure and deterministic: the source of truth for eligibility. AI may explain the result but never changes it.
export function evaluateRules(profile = {}, scholarship) {
  const rules = [];
  const add = (name, label, { unknown = false, pass = false, message, question, options }) =>
    rules.push({ name, label, status: unknown ? 'unknown' : pass ? 'pass' : 'fail', message, ...(unknown && question ? { question, ...(options ? { options } : {}) } : {}) });
  const { state, educationLevel, fieldOfStudy, yearOfStudy, gender, category, disabilityPercent, annualFamilyIncomeINR: income, percentage } = profile;

  const openToAllStates = scholarship.states.some(s => same(s, ALL_INDIA));
  add('state', 'State of residence', { unknown: blank(state), pass: inList(state, scholarship.states, ALL_INDIA),
    message: blank(state) ? 'State of residence not provided.' : inList(state, scholarship.states, ALL_INDIA) ? (openToAllStates ? 'Open to students from every state.' : `Open to residents of ${scholarship.states.join(', ')}.`) : `Only for residents of ${scholarship.states.join(', ')}.`,
    question: 'Which state or union territory are you a permanent resident of?', options: STATES });

  add('educationLevel', 'Education level', { unknown: blank(educationLevel), pass: inList(educationLevel, scholarship.educationLevels),
    message: blank(educationLevel) ? 'Education level not provided.' : inList(educationLevel, scholarship.educationLevels) ? `${educationLevel} is covered.` : `Covers ${scholarship.educationLevels.join(', ')} only.`,
    question: 'What is your current level of study?', options: EDUCATION_LEVELS });

  const openToAllFields = scholarship.fields.some(f => same(f, ALL_FIELDS));
  add('fieldOfStudy', 'Field of study', { unknown: blank(fieldOfStudy) && !openToAllFields, pass: openToAllFields || inList(fieldOfStudy, scholarship.fields),
    message: openToAllFields ? 'Open to all fields of study.' : blank(fieldOfStudy) ? 'Field of study not provided.' : inList(fieldOfStudy, scholarship.fields) ? `${fieldOfStudy} is an eligible field.` : `Limited to ${scholarship.fields.join(', ')}.`,
    question: 'Which field are you studying?', options: FIELDS_OF_STUDY });

  if (scholarship.yearsOfStudy?.length) {
    const ok = scholarship.yearsOfStudy.includes(Number(yearOfStudy));
    add('yearOfStudy', 'Year of study', { unknown: blank(yearOfStudy), pass: ok,
      message: blank(yearOfStudy) ? 'Year of study not provided.' : ok ? `Year ${yearOfStudy} is eligible.` : `Only for year ${scholarship.yearsOfStudy.join(' or ')} of the course.`,
      question: 'Which year of your current course are you in? (Class 11 = 1, Class 12 = 2)', options: YEARS_OF_STUDY.map(String) });
  }
  if (scholarship.genders?.length) {
    add('gender', 'Gender', { unknown: blank(gender), pass: inList(gender, scholarship.genders),
      message: blank(gender) ? 'Gender not provided.' : inList(gender, scholarship.genders) ? 'Meets the gender criterion.' : `Only for ${scholarship.genders.join(' / ').toLowerCase()} students.`,
      question: 'What is your gender?', options: GENDERS });
  }
  if (scholarship.socialCategories?.length) {
    add('category', 'Social category', { unknown: blank(category), pass: inList(category, scholarship.socialCategories),
      message: blank(category) ? 'Social category not provided.' : inList(category, scholarship.socialCategories) ? `${category} students are eligible.` : `Only for ${scholarship.socialCategories.join(', ')} students.`,
      question: 'Which social category are you in, as per your certificate?', options: SOCIAL_CATEGORIES });
  }
  if (scholarship.minDisabilityPercent > 0) {
    const ok = Number(disabilityPercent) >= scholarship.minDisabilityPercent;
    add('disability', 'Disability', { unknown: blank(disabilityPercent), pass: ok,
      message: blank(disabilityPercent) ? 'Disability percentage not provided.' : ok ? `Certified disability of ${disabilityPercent}% meets the ${scholarship.minDisabilityPercent}% minimum.` : `Requires a certified disability of at least ${scholarship.minDisabilityPercent}%.`,
      question: 'What is your certified disability percentage? Enter 0 if none.' });
  }

  const incomeLimit = forCategory(scholarship.incomeMaxByCategory, category, scholarship.incomeMaxINR, v => Math.max(...v));
  const limitVaries = Boolean(scholarship.incomeMaxByCategory) && blank(category) ? ' (the limit depends on your social category)' : '';
  if (incomeLimit === null || incomeLimit === undefined) add('income', 'Family income', { pass: true, message: 'No family income ceiling.' });
  else add('income', 'Family income', { unknown: blank(income), pass: Number(income) <= incomeLimit,
    message: blank(income) ? `Family income not provided; the limit is ${inr(incomeLimit)}${limitVaries}.` : Number(income) <= incomeLimit ? `Family income ${inr(income)} is within the ${inr(incomeLimit)} limit${limitVaries}.` : `Family income ${inr(income)} exceeds the ${inr(incomeLimit)} limit.`,
    question: 'What is your annual family income from all sources, in rupees?' });

  const minMarks = forCategory(scholarship.minPercentageByCategory, category, scholarship.minPercentage ?? 0, v => Math.min(...v));
  if (!(minMarks > 0)) add('academicPercentage', 'Marks', { pass: true, message: 'No minimum marks requirement.' });
  else add('academicPercentage', 'Marks', { unknown: blank(percentage), pass: Number(percentage) >= minMarks,
    message: blank(percentage) ? `Marks not provided; the minimum is ${minMarks}%.` : Number(percentage) >= minMarks ? `${percentage}% meets the ${minMarks}% minimum.` : `Requires at least ${minMarks}% (you entered ${percentage}%).`,
    question: 'What percentage did you score in your latest qualifying exam?' });

  // Conditions a profile cannot prove (exam rank, school type, institution approval...). They never block a match,
  // but they are always shown and become checklist items.
  (scholarship.manualChecks || []).forEach((text, i) => rules.push({ name: `confirm-${i + 1}`, label: 'Confirm before applying', status: 'verify', message: text }));

  const status = rules.some(r => r.status === 'fail') ? 'not_match' : rules.some(r => r.status === 'unknown') ? 'needs_review' : 'potential_match';
  return { rules, status };
}

export async function assessEligibility(profile, scholarship) {
  const { rules, status } = evaluateRules(profile, scholarship);
  const evidence = await retrieveOfficialEvidence({ query: `${scholarship.title} eligibility requirements documents deadline`, scholarshipId: scholarship.id });
  const ai = await explainEligibility({ profile, scholarship, ruleResults: rules, status, evidence });
  return { scholarshipId: scholarship.id, scholarshipTitle: scholarship.title, status, rules, summary: ai.summary, concerns: ai.concerns, questionsToAsk: ai.questionsToAsk, confidence: ai.confidence, aiEnabled: ai.aiEnabled, evidence: { configured: evidence.configured, matches: evidence.matches, note: evidence.note, sourceUrl: scholarship.sourceUrl, sourceLabel: scholarship.sourceLabel, applicationUrl: scholarship.applicationUrl, academicYear: scholarship.academicYear, lastVerifiedAt: scholarship.lastVerifiedAt, verification: scholarship.verification }, isDemo: Boolean(scholarship.isDemo), evaluatedAt: new Date().toISOString() };
}

export function chooseNextAction({ profile, assessment, application }) {
  if (!profile?.fullName || !profile?.state || !profile?.educationLevel || !profile?.fieldOfStudy) return { type: 'complete_profile', title: 'Complete your student profile', reason: 'The agent needs your course and location before it can compare scholarship rules.', requiresUserAction: true };
  if (!assessment) return { type: 'discover_opportunities', title: 'Investigate scholarship opportunities', reason: 'Your profile is ready. Search the catalogue and assess potential matches against the available rules.', requiresUserAction: false };
  if (assessment.status === 'needs_review') return { type: 'request_information', title: 'Resolve missing eligibility information', reason: 'At least one required fact is missing or uncertain. The agent should ask before drawing a conclusion.', requiresUserAction: true };
  if (assessment.status === 'not_match') return { type: 'review_alternatives', title: 'Review alternative opportunities', reason: 'One or more catalogue rules do not match. The agent should not prepare this application as eligible.', requiresUserAction: true };
  if (!application) return { type: 'prepare_checklist', title: 'Prepare an application checklist', reason: 'This is only a potential match. Create a checklist and validate every required document before proceeding.', requiresUserAction: true };
  const unfinished = application.tasks?.filter(t => t.status !== 'done') || [];
  if (unfinished.length) return { type: 'complete_task', title: `Complete: ${unfinished[0].title}`, reason: unfinished[0].description || 'A required checklist task remains incomplete.', taskId: unfinished[0]._id, requiresUserAction: true };
  return { type: 'review_draft', title: 'Review your application draft', reason: 'All checklist items are marked complete. Review the prepared information before any external submission.', requiresUserAction: true };
}
