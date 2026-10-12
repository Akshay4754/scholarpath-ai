import test from 'node:test';
import assert from 'node:assert/strict';
import { scholarships, CATALOGUE_REVIEWED_AT } from '../src/data/scholarships.js';
import { ALL_FIELDS, ALL_INDIA, EDUCATION_LEVELS, FIELDS_OF_STUDY, GENDERS, SOCIAL_CATEGORIES, STATES, YEARS_OF_STUDY } from '../src/data/profileOptions.js';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const httpsUrl = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const subsetOf = (values, allowed) => values.every(v => allowed.includes(v));

test('catalogue ids are unique and stable slugs', () => {
  const ids = scholarships.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(id => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)));
});

for (const s of scholarships) {
  test(`record ${s.id} is complete and internally consistent`, () => {
    for (const key of ['title', 'provider', 'providerType', 'category', 'amountLabel', 'summary', 'academicYear', 'sourceLabel']) assert.ok(String(s[key] || '').trim(), `${key} is required`);
    assert.equal(s.isDemo, false);
    assert.ok(httpsUrl(s.sourceUrl), 'sourceUrl must be an https link to an official source');
    assert.ok(s.applicationUrl === null || httpsUrl(s.applicationUrl), 'applicationUrl must be https');
    assert.ok(['official-document', 'public-sources'].includes(s.verification));
    assert.ok(['Central Government', 'State Government', 'Corporate / Foundation'].includes(s.providerType));
    assert.match(s.lastVerifiedAt, isoDate);
    assert.ok(s.lastVerifiedAt <= CATALOGUE_REVIEWED_AT);

    assert.ok(s.states.length && subsetOf(s.states, [ALL_INDIA, ...STATES]), 'states must use profile option values');
    assert.ok(s.educationLevels.length && subsetOf(s.educationLevels, EDUCATION_LEVELS));
    assert.ok(s.fields.length && subsetOf(s.fields, [ALL_FIELDS, ...FIELDS_OF_STUDY]));
    if (s.genders) assert.ok(s.genders.length && subsetOf(s.genders, GENDERS));
    if (s.socialCategories) assert.ok(s.socialCategories.length && subsetOf(s.socialCategories, SOCIAL_CATEGORIES));
    if (s.yearsOfStudy) assert.ok(s.yearsOfStudy.length && subsetOf(s.yearsOfStudy, YEARS_OF_STUDY));
    if (s.minDisabilityPercent !== undefined) assert.ok(s.minDisabilityPercent > 0 && s.minDisabilityPercent <= 100);

    assert.ok(s.incomeMaxINR === null || (Number.isInteger(s.incomeMaxINR) && s.incomeMaxINR > 0));
    for (const [cat, limit] of Object.entries(s.incomeMaxByCategory || {})) { assert.ok(SOCIAL_CATEGORIES.includes(cat)); assert.ok(limit > 0); }
    assert.ok(s.minPercentage >= 0 && s.minPercentage <= 100);
    for (const [cat, min] of Object.entries(s.minPercentageByCategory || {})) { assert.ok(SOCIAL_CATEGORIES.includes(cat)); assert.ok(min >= 0 && min <= 100); }

    assert.ok(s.deadline === null || isoDate.test(s.deadline));
    assert.equal(s.deadline === null, s.deadlineSource === null, 'deadline and deadlineSource go together');
    if (s.deadlineSource) assert.ok(['official', 'reported'].includes(s.deadlineSource));
    assert.ok(s.requiredDocuments.length > 0);
    assert.ok(s.rules.length > 0);
    assert.ok(Array.isArray(s.manualChecks));
  });
}
