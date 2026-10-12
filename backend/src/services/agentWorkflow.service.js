import { assessEligibility } from './eligibility.service.js';

const questionReasons = {
  state: 'State-specific schemes have residency rules.',
  educationLevel: 'The scheme only supports certain levels of study.',
  fieldOfStudy: 'Some schemes restrict eligible courses or disciplines.',
  yearOfStudy: 'Some schemes only accept first-year (or lateral-entry) students.',
  gender: 'This scheme is reserved for a specific gender.',
  category: 'This scheme is reserved for specific social categories.',
  disability: 'This scheme requires a certified minimum disability percentage.',
  income: 'Income limits must be checked against the scheme rules.',
  academicPercentage: 'The scheme has a minimum marks requirement.'
};

export function buildFollowUpQuestions(assessment) {
  return (assessment?.rules || [])
    .filter(rule => rule.status === 'unknown' && rule.question)
    .map(rule => ({ field: rule.name, question: rule.question, reason: questionReasons[rule.name] || 'This information is required to continue the assessment.', options: rule.options || [] }));
}

export function buildChecklist(scholarship) {
  const tasks = (scholarship.requiredDocuments || []).map(title => ({ title: `Provide ${title}`, description: `Upload or confirm ${title}; verify name, issuer, dates, and readability.`, required: true, status: 'todo' }));
  (scholarship.manualChecks || []).forEach(text => tasks.push({ title: 'Confirm eligibility condition', description: text, required: true, status: 'todo' }));
  tasks.push({ title: 'Verify current official scheme rules', description: `Confirm the academic year, deadline, eligibility conditions, and submission channel on ${scholarship.sourceLabel || 'the official source'}.`, required: true, status: 'needs_review' });
  tasks.push({ title: 'Review application draft', description: 'Check all fields and attachments. ScholarPath will not submit to a third-party portal.', required: true, status: 'todo' });
  return tasks;
}

export async function evaluateRun(run, scholarship) {
  const assessment = await assessEligibility(run.profileSnapshot, scholarship);
  run.assessment = assessment;
  const questions = buildFollowUpQuestions(assessment);
  run.questions = questions;
  if (assessment.status === 'not_match') {
    run.status = 'needs_attention';
    run.currentQuestion = null;
    run.draftApproval = 'not_ready';
    addEvent(run, 'decision', 'Eligibility rule did not match', 'The agent will not prepare this application as an eligible match. Review the rule evidence or investigate alternatives.');
  } else if (questions.length) {
    run.status = 'waiting_for_user';
    run.currentQuestion = questions[0];
    run.draftApproval = 'not_ready';
    addEvent(run, 'question', 'Additional information required', `The agent identified ${questions.length} unanswered eligibility item(s).`);
  } else {
    run.currentQuestion = null;
    run.checklist = buildChecklist(scholarship);
    run.draftApproval = 'pending_review';
    run.status = 'ready_for_review';
    addEvent(run, 'checklist', 'Application preparation checklist created', 'The workflow is ready for student review. No application has been submitted.');
  }
  return run;
}

export function addEvent(run, type, title, detail = '') {
  run.events.push({ type, title, detail, at: new Date() });
}
