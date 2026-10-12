import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRules } from '../src/services/eligibility.service.js';
import { findScholarship } from '../src/data/scholarships.js';

const rule = (result, name) => result.rules.find(r => r.name === name);
const student = { fullName: 'Test Student', state: 'Karnataka', educationLevel: 'Undergraduate', fieldOfStudy: 'Engineering & Technology', yearOfStudy: 1, gender: 'Female', category: 'General', annualFamilyIncomeINR: 300000, percentage: 82 };

test('a fully matching profile is a potential match, with manual conditions still listed', () => {
  const result = evaluateRules(student, findScholarship('central-aicte-pragati'));
  assert.equal(result.status, 'potential_match');
  assert.ok(result.rules.some(r => r.status === 'verify'));
  assert.ok(result.rules.filter(r => r.status !== 'verify').every(r => r.status === 'pass'));
});

test('gender restriction fails for an ineligible gender', () => {
  const result = evaluateRules({ ...student, gender: 'Male' }, findScholarship('central-aicte-pragati'));
  assert.equal(result.status, 'not_match');
  assert.equal(rule(result, 'gender').status, 'fail');
});

test('social category restriction is enforced and asked for when missing', () => {
  const pms = findScholarship('central-pms-sc');
  assert.equal(evaluateRules({ ...student, educationLevel: 'Undergraduate', annualFamilyIncomeINR: 200000 }, pms).status, 'not_match');
  const missing = evaluateRules({ ...student, category: '', annualFamilyIncomeINR: 200000 }, pms);
  assert.equal(missing.status, 'needs_review');
  assert.equal(rule(missing, 'category').status, 'unknown');
  assert.ok(rule(missing, 'category').options.includes('SC'));
});

test('a blank percentage passes when the scheme has no minimum marks', () => {
  const result = evaluateRules({ ...student, percentage: '', category: 'SC', annualFamilyIncomeINR: 200000 }, findScholarship('central-pms-sc'));
  assert.equal(rule(result, 'academicPercentage').status, 'pass');
  assert.equal(result.status, 'potential_match');
});

test('schemes without an income ceiling never fail on income', () => {
  const result = evaluateRules({ ...student, fieldOfStudy: 'Natural & Basic Sciences', annualFamilyIncomeINR: 5000000 }, findScholarship('central-inspire-she'));
  assert.equal(rule(result, 'income').status, 'pass');
});

test('category-specific income limits apply, and unknown category uses the most lenient limit', () => {
  const up = findScholarship('up-post-matric-dashmottar');
  const base = { ...student, state: 'Uttar Pradesh', annualFamilyIncomeINR: 230000 };
  assert.equal(rule(evaluateRules({ ...base, category: 'General' }, up), 'income').status, 'fail');
  assert.equal(rule(evaluateRules({ ...base, category: 'SC' }, up), 'income').status, 'pass');
  assert.equal(rule(evaluateRules({ ...base, category: '' }, up), 'income').status, 'pass');
});

test('category-specific minimum marks apply', () => {
  const nmmss = findScholarship('central-nmmss');
  const base = { ...student, educationLevel: 'Class 9-10', fieldOfStudy: 'School (no specialisation)', annualFamilyIncomeINR: 200000, percentage: 52 };
  assert.equal(rule(evaluateRules({ ...base, category: 'General' }, nmmss), 'academicPercentage').status, 'fail');
  assert.equal(rule(evaluateRules({ ...base, category: 'ST' }, nmmss), 'academicPercentage').status, 'pass');
});

test('state-specific schemes reject other states', () => {
  const result = evaluateRules(student, findScholarship('tn-pudhumai-penn'));
  assert.equal(rule(result, 'state').status, 'fail');
  assert.equal(result.status, 'not_match');
});

test('disability minimum and first-year restrictions are enforced', () => {
  const saksham = findScholarship('central-aicte-saksham');
  assert.equal(rule(evaluateRules({ ...student, disabilityPercent: 30 }, saksham), 'disability').status, 'fail');
  assert.equal(rule(evaluateRules({ ...student, disabilityPercent: 45 }, saksham), 'disability').status, 'pass');
  assert.equal(rule(evaluateRules({ ...student, disabilityPercent: '' }, saksham), 'disability').status, 'unknown');
  assert.equal(rule(evaluateRules({ ...student, yearOfStudy: 3 }, findScholarship('private-kotak-kanya')), 'yearOfStudy').status, 'fail');
});

test('missing facts produce follow-up questions instead of a conclusion', () => {
  const result = evaluateRules({ fullName: 'New Student' }, findScholarship('central-csss-pm-usp'));
  assert.equal(result.status, 'needs_review');
  const asked = result.rules.filter(r => r.status === 'unknown').map(r => r.name);
  assert.deepEqual(asked.sort(), ['educationLevel', 'income', 'state'].sort());
});
