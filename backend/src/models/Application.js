import mongoose from 'mongoose';
import { ownedRecord } from './ownership.js';
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true }, description: String,
  status: { type: String, enum: ['todo', 'in_progress', 'done', 'needs_review'], default: 'todo' },
  required: { type: Boolean, default: true }, evidence: String, dueDate: Date
}, { _id: true });
const ApplicationSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  scholarshipId: { type: String, required: true }, scholarshipTitle: String,
  status: { type: String, enum: ['investigating', 'preparing', 'ready_for_review', 'submitted_by_user', 'needs_attention', 'closed'], default: 'preparing' },
  eligibilityStatus: { type: String, enum: ['potential_match', 'not_match', 'needs_review'], default: 'needs_review' },
  tasks: [TaskSchema], notes: [String], agentEvents: [{ action: String, reason: String, at: { type: Date, default: Date.now } }], userApprovedDraftAt: Date
}, { timestamps: true });
ownedRecord(ApplicationSchema);
export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
