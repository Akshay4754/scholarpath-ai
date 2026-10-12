import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { extractDocument } from '../services/document.service.js';
import { Profile } from '../models/Profile.js';
import { Application } from '../models/Application.js';
import { AgentRun } from '../models/AgentRun.js';
import { evaluateRun, addEvent, buildChecklist } from '../services/agentWorkflow.service.js';
import { scholarships, findScholarship, CATALOGUE_REVIEWED_AT } from '../data/scholarships.js';
import { profileOptions, STATES, EDUCATION_LEVELS, FIELDS_OF_STUDY, GENDERS, SOCIAL_CATEGORIES, ALL_INDIA, ALL_FIELDS } from '../data/profileOptions.js';
import { assessEligibility, evaluateRules, chooseNextAction } from '../services/eligibility.service.js';
import { env } from '../config/env.js';

export const api = Router();
const uploadDir = path.resolve(env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
  cb(allowed.includes(file.mimetype) ? null : Object.assign(new Error('Only PDF, PNG, or JPEG files are accepted.'), { status: 400 }), allowed.includes(file.mimetype));
} });

const dbReady = () => mongoose.connection.readyState === 1;
const isPersistentId = id => mongoose.isValidObjectId(id) && !String(id).startsWith('demo-');
const persistence = () => (dbReady() ? 'mongodb' : 'memory');
const serialize = doc => (doc?.toObject ? doc.toObject() : (({ ownerKeyHash, ...rest }) => rest)(doc));
const defined = obj => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// Ownership without accounts: each browser keeps a random client key and sends it on every request.
// Records are stored with the key's hash, and lookups always filter by it, so one browser cannot read another's data.
const CLIENT_KEY = /^[A-Za-z0-9_-]{32,128}$/;
function requireClientKey(req, res, next) {
  const key = String(req.get('x-client-key') || '');
  if (!CLIENT_KEY.test(key)) return res.status(401).json({ error: 'Missing or invalid client key. Reload the app to create one.' });
  req.ownerKeyHash = crypto.createHash('sha256').update(key).digest('hex');
  next();
}
api.use(['/profile', '/applications', '/agent-runs'], requireClientKey);

const optional = schema => z.preprocess(v => (v === '' || v === null ? undefined : v), schema.optional());
const ProfileFields = {
  fullName: z.string().trim().min(2).max(120), email: optional(z.string().trim().email().max(200)),
  state: z.enum(STATES), educationLevel: z.enum(EDUCATION_LEVELS), fieldOfStudy: z.enum(FIELDS_OF_STUDY), institution: optional(z.string().trim().max(200)),
  yearOfStudy: optional(z.coerce.number().int().min(1).max(6)), gender: optional(z.enum(GENDERS)), category: optional(z.enum(SOCIAL_CATEGORIES)),
  disabilityPercent: optional(z.coerce.number().min(0).max(100)), annualFamilyIncomeINR: optional(z.coerce.number().min(0).max(1e9)), percentage: optional(z.coerce.number().min(0).max(100))
};
const ProfileInput = z.object(ProfileFields);
// Assessments and agent runs accept partial profiles: missing facts become follow-up questions, not errors.
const PartialProfile = z.object(Object.fromEntries(Object.entries(ProfileFields).map(([k, v]) => [k, optional(v)])));
const OPTIONAL_PROFILE_KEYS = ['email', 'institution', 'yearOfStudy', 'gender', 'category', 'disabilityPercent', 'annualFamilyIncomeINR', 'percentage'];
const TaskStatus = z.enum(['todo', 'in_progress', 'done', 'needs_review']);

const oneOf = list => v => list.find(x => x.toLowerCase() === String(v).trim().toLowerCase());
const numberIn = (min, max, strip = /[\s,₹%]/g) => v => { const n = Number(String(v).replace(strip, '')); return Number.isFinite(n) && n >= min && n <= max ? n : undefined; };
const AnswerFields = {
  state: { key: 'state', parse: oneOf(STATES), options: STATES }, educationLevel: { key: 'educationLevel', parse: oneOf(EDUCATION_LEVELS), options: EDUCATION_LEVELS },
  fieldOfStudy: { key: 'fieldOfStudy', parse: oneOf(FIELDS_OF_STUDY), options: FIELDS_OF_STUDY }, gender: { key: 'gender', parse: oneOf(GENDERS), options: GENDERS },
  category: { key: 'category', parse: oneOf(SOCIAL_CATEGORIES), options: SOCIAL_CATEGORIES },
  yearOfStudy: { key: 'yearOfStudy', parse: v => { const n = numberIn(1, 6)(v); return Number.isInteger(n) ? n : undefined; } },
  disability: { key: 'disabilityPercent', parse: numberIn(0, 100) }, income: { key: 'annualFamilyIncomeINR', parse: numberIn(0, 1e9) }, academicPercentage: { key: 'percentage', parse: numberIn(0, 100) }
};

const demoAgentRuns = new Map();
async function getAgentRun(id, ownerKeyHash) {
  if (dbReady() && !String(id).startsWith('demo-run-')) return isPersistentId(id) ? AgentRun.findOne({ _id: id, ownerKeyHash }) : null;
  const run = demoAgentRuns.get(String(id));
  return run && run.ownerKeyHash === ownerKeyHash ? run : null;
}
async function saveAgentRun(run) {
  if (run.save && dbReady()) return run.save();
  demoAgentRuns.set(String(run._id), run);
  return run;
}
async function ownedProfile(profileId, ownerKeyHash) {
  return dbReady() && isPersistentId(profileId) ? Profile.findOne({ _id: profileId, ownerKeyHash }) : null;
}

api.get('/health', (_req, res) => res.json({ ok: true, service: 'scholarpath-api', database: dbReady() ? 'connected' : env.mongoUri ? 'unavailable' : 'not_configured', persistence: persistence(), aiConfigured: Boolean(env.geminiApiKey), retrievalConfigured: Boolean(env.pineconeApiKey && env.pineconeIndexName), catalogue: { schemes: scholarships.length, reviewedAt: CATALOGUE_REVIEWED_AT }, timestamp: new Date().toISOString() }));
api.get('/meta', (_req, res) => res.json({ profileOptions, catalogue: { schemes: scholarships.length, reviewedAt: CATALOGUE_REVIEWED_AT, providerTypes: [...new Set(scholarships.map(s => s.providerType))] } }));

api.get('/scholarships', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const { state, level, field, providerType } = req.query;
  const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
  const items = scholarships.filter(s => (!q || `${s.title} ${s.provider} ${s.summary} ${s.category}`.toLowerCase().includes(q))
    && (!state || s.states.some(x => same(x, ALL_INDIA) || same(x, state)))
    && (!level || s.educationLevels.some(x => same(x, level)))
    && (!field || s.fields.some(x => same(x, ALL_FIELDS) || same(x, field)))
    && (!providerType || same(s.providerType, providerType)));
  res.json({ items, total: items.length, reviewedAt: CATALOGUE_REVIEWED_AT, notice: 'Compiled from official scheme sources. Rules, amounts and deadlines change every year — confirm on the official portal before applying.' });
});
api.get('/scholarships/:id', (req, res) => {
  const scholarship = findScholarship(req.params.id);
  if (!scholarship) return res.status(404).json({ error: 'Scholarship not found' });
  res.json({ scholarship });
});

api.post('/profile', async (req, res, next) => {
  try {
    const parsed = ProfileInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid profile', details: parsed.error.flatten() });
    const data = defined(parsed.data);
    if (dbReady()) {
      const $unset = Object.fromEntries(OPTIONAL_PROFILE_KEYS.filter(k => data[k] === undefined).map(k => [k, '']));
      const doc = await Profile.findOneAndUpdate({ ownerKeyHash: req.ownerKeyHash }, { $set: data, ...(Object.keys($unset).length ? { $unset } : {}) }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
      return res.json({ profile: serialize(doc), persistence: 'mongodb' });
    }
    return res.json({ profile: { ...data, _id: 'demo-profile', documents: [] }, persistence: 'memory', note: 'Configure MongoDB to keep profiles between visits.' });
  } catch (e) { next(e); }
});
api.get('/profile', async (req, res, next) => {
  try {
    const profile = dbReady() ? await Profile.findOne({ ownerKeyHash: req.ownerKeyHash }) : null;
    // A first-time visitor simply has no profile yet; that is not an error.
    res.json({ profile: profile ? serialize(profile) : null });
  } catch (e) { next(e); }
});
api.get('/profile/:profileId', async (req, res, next) => {
  try {
    const profile = await ownedProfile(req.params.profileId, req.ownerKeyHash);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: serialize(profile) });
  } catch (e) { next(e); }
});

api.post('/eligibility/assess', async (req, res, next) => {
  try {
    const { profile, scholarshipId } = req.body || {};
    const scholarship = findScholarship(scholarshipId);
    const parsed = PartialProfile.safeParse(profile || {});
    if (!scholarship) return res.status(400).json({ error: 'A valid scholarshipId is required.' });
    if (!parsed.success) return res.status(400).json({ error: 'Invalid profile', details: parsed.error.flatten() });
    res.json({ assessment: await assessEligibility(defined(parsed.data), scholarship) });
  } catch (e) { next(e); }
});
api.post('/agent/next-action', (req, res) => {
  const nextAction = chooseNextAction(req.body || {});
  res.json({ nextAction, generatedAt: new Date().toISOString() });
});

api.get('/applications', async (req, res, next) => {
  try {
    const items = dbReady() ? await Application.find({ ownerKeyHash: req.ownerKeyHash }).sort({ createdAt: -1 }).limit(50) : [];
    res.json({ items: items.map(serialize), persistence: persistence() });
  } catch (e) { next(e); }
});
api.post('/applications', async (req, res, next) => {
  try {
    const { profileId, profile, scholarshipId } = req.body || {};
    const scholarship = findScholarship(scholarshipId);
    if (!scholarship) return res.status(400).json({ error: 'A valid scholarshipId is required.' });
    const saved = await ownedProfile(profileId, req.ownerKeyHash);
    const parsed = PartialProfile.safeParse(saved ? saved.toObject() : profile || {});
    if (!saved && (!profile || !parsed.success)) return res.status(400).json({ error: 'A valid profile or saved profileId is required.' });
    // Re-check eligibility on the server instead of trusting a client-supplied assessment.
    const { status } = evaluateRules(defined(parsed.success ? parsed.data : {}), scholarship);
    if (status === 'not_match') return res.status(409).json({ error: 'Cannot prepare an application when the rule assessment is a non-match.' });
    const tasks = buildChecklist(scholarship);
    if (dbReady()) {
      const app = await Application.create({ ownerKeyHash: req.ownerKeyHash, profileId: saved?._id, scholarshipId, scholarshipTitle: scholarship.title, eligibilityStatus: status, tasks, agentEvents: [{ action: 'application_workspace_created', reason: 'Created a draft checklist; no external application was submitted.' }] });
      return res.status(201).json({ application: serialize(app), persistence: 'mongodb' });
    }
    res.status(201).json({ application: { _id: `demo-app-${Date.now()}`, scholarshipId, scholarshipTitle: scholarship.title, status: 'preparing', eligibilityStatus: status, createdAt: new Date().toISOString(), tasks: tasks.map((t, i) => ({ ...t, _id: `task-${i + 1}` })), agentEvents: [{ action: 'application_workspace_created', reason: 'Checklist created for this session. No external application was submitted.' }] }, persistence: 'memory' });
  } catch (e) { next(e); }
});
api.get('/applications/:id', async (req, res, next) => {
  try {
    const application = dbReady() && isPersistentId(req.params.id) ? await Application.findOne({ _id: req.params.id, ownerKeyHash: req.ownerKeyHash }) : null;
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: serialize(application) });
  } catch (e) { next(e); }
});
api.patch('/applications/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const status = TaskStatus.safeParse(req.body?.status);
    if (!status.success) return res.status(400).json({ error: 'Invalid task status' });
    if (!dbReady() || !isPersistentId(req.params.id)) return res.status(501).json({ error: 'Task persistence requires MongoDB and a saved application.' });
    const application = await Application.findOne({ _id: req.params.id, ownerKeyHash: req.ownerKeyHash });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    const task = application.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.status = status.data;
    application.agentEvents.push({ action: 'task_updated', reason: `Task ${task.title} changed to ${status.data}` });
    application.status = application.tasks.every(t => t.status === 'done') ? 'ready_for_review' : 'preparing';
    await application.save();
    res.json({ application: serialize(application) });
  } catch (e) { next(e); }
});

// Stateful agent workflow: each run is resumable; without MongoDB, runs live in memory until the server restarts.
api.post('/agent-runs', async (req, res, next) => {
  try {
    const { profile, profileId, scholarshipId, applicationId = '' } = req.body || {};
    const scholarship = findScholarship(scholarshipId);
    if (!scholarship) return res.status(400).json({ error: 'A valid scholarshipId is required.' });
    const saved = await ownedProfile(profileId, req.ownerKeyHash);
    const parsed = PartialProfile.safeParse(saved ? saved.toObject() : profile || {});
    if (!parsed.success || !parsed.data.fullName) return res.status(400).json({ error: 'Provide a student profile with at least your name.' });
    const profileSnapshot = defined(parsed.data);
    const startEvent = { type: 'started', title: 'Investigation started', detail: 'The agent will check available facts, retrieve configured evidence, and ask about missing information.', at: new Date() };
    const run = dbReady()
      ? new AgentRun({ ownerKeyHash: req.ownerKeyHash, profileId: saved?._id, profileSnapshot, scholarshipId, scholarshipTitle: scholarship.title, applicationId: String(applicationId || ''), status: 'investigating', events: [startEvent] })
      : { _id: `demo-run-${crypto.randomUUID()}`, ownerKeyHash: req.ownerKeyHash, profileSnapshot, scholarshipId, scholarshipTitle: scholarship.title, applicationId: String(applicationId || ''), status: 'investigating', events: [{ ...startEvent, detail: `${startEvent.detail} This run is kept in memory until the server restarts.` }], questions: [], responses: [], checklist: [], draftApproval: 'not_ready' };
    await evaluateRun(run, scholarship);
    await saveAgentRun(run);
    res.status(201).json({ run: serialize(run), persistence: persistence() });
  } catch (error) { next(error); }
});
api.get('/agent-runs/:id', async (req, res, next) => {
  try {
    const run = await getAgentRun(req.params.id, req.ownerKeyHash);
    if (!run) return res.status(404).json({ error: 'Agent run not found.' });
    res.json({ run: serialize(run), persistence: persistence() });
  } catch (error) { next(error); }
});
api.post('/agent-runs/:id/respond', async (req, res, next) => {
  try {
    const run = await getAgentRun(req.params.id, req.ownerKeyHash);
    if (!run) return res.status(404).json({ error: 'Agent run not found.' });
    if (run.status !== 'waiting_for_user' || !run.currentQuestion) return res.status(409).json({ error: 'This run is not waiting for an answer.' });
    const answer = req.body?.answer;
    if (answer === undefined || answer === null || String(answer).trim() === '') return res.status(400).json({ error: 'An answer is required.' });
    const field = run.currentQuestion.field;
    const spec = AnswerFields[field];
    if (!spec) return res.status(400).json({ error: 'Unsupported question field.' });
    const normalized = spec.parse(answer);
    if (normalized === undefined) return res.status(400).json({ error: spec.options ? `Choose one of: ${spec.options.join(', ')}.` : 'Enter a valid number.' });
    run.profileSnapshot[spec.key] = normalized;
    run.markModified?.('profileSnapshot'); // Mixed path: in-place edits are not change-tracked by Mongoose
    run.responses.push({ field, answer: normalized, at: new Date() });
    addEvent(run, 'answer', 'Student supplied information', `${run.currentQuestion.question} — recorded for reassessment.`);
    if (run.profileId && dbReady()) await Profile.updateOne({ _id: run.profileId, ownerKeyHash: req.ownerKeyHash }, { $set: { [spec.key]: normalized } });
    const scholarship = findScholarship(run.scholarshipId);
    if (!scholarship) return res.status(404).json({ error: 'Scholarship catalogue entry no longer exists.' });
    await evaluateRun(run, scholarship);
    await saveAgentRun(run);
    res.json({ run: serialize(run), persistence: persistence() });
  } catch (error) { next(error); }
});
api.patch('/agent-runs/:id/checklist/:taskIndex', async (req, res, next) => {
  try {
    const run = await getAgentRun(req.params.id, req.ownerKeyHash);
    if (!run) return res.status(404).json({ error: 'Agent run not found.' });
    const index = Number(req.params.taskIndex);
    if (!Number.isInteger(index) || index < 0 || index >= (run.checklist || []).length) return res.status(404).json({ error: 'Checklist item not found.' });
    const parsed = TaskStatus.safeParse(req.body?.status);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid checklist status.' });
    if (run.status === 'completed') return res.status(409).json({ error: 'This run is already completed.' });
    run.checklist[index].status = parsed.data;
    addEvent(run, 'task', 'Checklist updated', `${run.checklist[index].title}: ${parsed.data}`);
    run.status = 'ready_for_review';
    run.draftApproval = 'pending_review';
    await saveAgentRun(run);
    res.json({ run: serialize(run) });
  } catch (error) { next(error); }
});
api.post('/agent-runs/:id/approve-draft', async (req, res, next) => {
  try {
    const run = await getAgentRun(req.params.id, req.ownerKeyHash);
    if (!run) return res.status(404).json({ error: 'Agent run not found.' });
    if (run.status !== 'ready_for_review' || run.draftApproval !== 'pending_review') return res.status(409).json({ error: 'The draft is not ready for review.' });
    if ((run.checklist || []).some(task => task.required && task.status !== 'done')) return res.status(409).json({ error: 'Complete or review every required checklist item before approving this draft.' });
    run.draftApproval = 'approved_for_export';
    run.status = 'completed';
    addEvent(run, 'approval', 'Draft approved by student', 'Approval applies to this prepared draft/export only. No third-party portal was submitted.');
    await saveAgentRun(run);
    res.json({ run: serialize(run), message: 'Draft marked approved for export. No application was submitted.' });
  } catch (error) { next(error); }
});

api.post('/documents/extract', upload.single('document'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a document using field name "document".' });
  try {
    const extracted = await extractDocument(req.file);
    res.json({ file: { originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size }, textExtracted: Boolean(extracted.text?.trim()), extractedTextPreview: String(extracted.text || '').slice(0, 1200), extractedFields: extracted.extractedFields || {}, extractionMethod: extracted.extractionMethod, needsHumanReview: true, warning: extracted.warning || 'OCR/extraction is fallible. Verify every field against the original document before using it for an eligibility decision.' });
  } catch (e) { next(e); }
  finally { try { fs.unlinkSync(req.file.path); } catch {} }
});
