import { gemini } from './gemini.js';
import { env } from '../config/env.js';
import { z } from 'zod';
const AssessmentSchema = z.object({ summary: z.string(), concerns: z.array(z.string()), questionsToAsk: z.array(z.string()), confidence: z.enum(['low', 'medium', 'high']) });
const RANK = { low: 0, medium: 1, high: 2 };

function deterministicExplanation(ruleResults, status, scholarship) {
  const failed = ruleResults.filter(r => r.status === 'fail');
  const missing = ruleResults.filter(r => r.status === 'unknown');
  const toConfirm = ruleResults.filter(r => r.status === 'verify');
  const summary = status === 'not_match'
    ? `Not eligible: ${failed.map(r => r.message).join(' ')}`
    : status === 'needs_review'
      ? `${missing.length} detail${missing.length === 1 ? '' : 's'} missing before a conclusion: ${missing.map(r => r.label.toLowerCase()).join(', ')}.`
      : toConfirm.length
        ? `You meet every rule that can be checked from your profile. Confirm ${toConfirm.length} more condition${toConfirm.length === 1 ? '' : 's'} on the official source before applying.`
        : 'You meet every listed rule. Confirm the details on the official source before applying.';
  // Confidence reflects how much the engine could check and how the record was verified; it is never "high" for an inference.
  const confidence = status === 'needs_review' ? 'low' : scholarship.verification === 'official-document' && !toConfirm.length ? 'high' : 'medium';
  return { summary, concerns: [...failed, ...missing].map(r => r.message), questionsToAsk: missing.map(r => r.question).filter(Boolean), confidence };
}

export async function explainEligibility({ profile, scholarship, ruleResults, status, evidence }) {
  const fallback = deterministicExplanation(ruleResults, status, scholarship);
  if (!env.geminiApiKey) return { ...fallback, aiEnabled: false };
  try {
    const ai = gemini();
    const prompt = `You are a cautious scholarship eligibility assistant for Indian students. Do not invent rules. The deterministic status "${status}" and rule checks are authoritative; explain them, do not change them. Rules with status "verify" are conditions the student must confirm on the official source. If retrieved evidence is empty, rely only on the catalogue record. Return JSON only matching schema {summary:string,concerns:string[],questionsToAsk:string[],confidence:"low"|"medium"|"high"}.\nPROFILE: ${JSON.stringify({ state: profile.state, educationLevel: profile.educationLevel, fieldOfStudy: profile.fieldOfStudy, yearOfStudy: profile.yearOfStudy, gender: profile.gender, category: profile.category, disabilityPercent: profile.disabilityPercent, annualFamilyIncomeINR: profile.annualFamilyIncomeINR, percentage: profile.percentage })}\nPROGRAM: ${JSON.stringify({ title: scholarship.title, provider: scholarship.provider, rules: scholarship.rules, manualChecks: scholarship.manualChecks, sourceUrl: scholarship.sourceUrl, academicYear: scholarship.academicYear, verification: scholarship.verification })}\nRULE CHECKS: ${JSON.stringify(ruleResults)}\nRETRIEVED EVIDENCE: ${JSON.stringify(evidence.matches?.map(m => ({ text: m.text, sourceUrl: m.sourceUrl, academicYear: m.academicYear })) || [])}`;
    const response = await ai.models.generateContent({ model: env.geminiModel, contents: prompt, config: { thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { summary: { type: 'STRING' }, concerns: { type: 'ARRAY', items: { type: 'STRING' } }, questionsToAsk: { type: 'ARRAY', items: { type: 'STRING' } }, confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] } }, required: ['summary', 'concerns', 'questionsToAsk', 'confidence'] } } });
    const parsed = AssessmentSchema.parse(JSON.parse(response.text));
    // The model may lower confidence but never raise it above what the deterministic checks support.
    const confidence = RANK[parsed.confidence] < RANK[fallback.confidence] ? parsed.confidence : fallback.confidence;
    return { ...parsed, confidence, aiEnabled: true };
  } catch (error) {
    return { ...fallback, aiEnabled: false, aiError: error.message };
  }
}
