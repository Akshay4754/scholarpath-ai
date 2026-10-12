import mongoose from 'mongoose';
import { ownedRecord } from './ownership.js';

const AgentEventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  detail: { type: String, default: '' },
  at: { type: Date, default: Date.now }
}, { _id: true });

const AgentRunSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  profileSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  scholarshipId: { type: String, required: true },
  scholarshipTitle: { type: String, required: true },
  applicationId: { type: String, default: '' },
  status: { type: String, enum: ['investigating', 'waiting_for_user', 'preparing_checklist', 'ready_for_review', 'needs_attention', 'completed'], default: 'investigating' },
  currentQuestion: { type: mongoose.Schema.Types.Mixed, default: null },
  questions: [{ field: String, question: String, reason: String, options: [String], answeredAt: Date }],
  responses: [{ field: String, answer: mongoose.Schema.Types.Mixed, at: { type: Date, default: Date.now } }],
  assessment: { type: mongoose.Schema.Types.Mixed, default: null },
  checklist: [{ title: String, description: String, required: Boolean, status: { type: String, enum: ['todo', 'in_progress', 'done', 'needs_review'], default: 'todo' } }],
  draftApproval: { type: String, enum: ['not_ready', 'pending_review', 'approved_for_export'], default: 'not_ready' },
  events: [AgentEventSchema]
}, { timestamps: true });

ownedRecord(AgentRunSchema);
export const AgentRun = mongoose.models.AgentRun || mongoose.model('AgentRun', AgentRunSchema);
