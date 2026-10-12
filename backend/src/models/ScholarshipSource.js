import mongoose from 'mongoose';
const ScholarshipSourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, sourceUrl: { type: String, required: true, unique: true },
  provider: { type: String, default: '' }, scholarshipId: { type: String, default: '' }, academicYear: { type: String, default: '' },
  contentHash: { type: String, required: true }, textLength: { type: Number, default: 0 }, chunkCount: { type: Number, default: 0 },
  lastFetchedAt: Date, lastIndexedAt: Date, lastVerifiedAt: Date, status: { type: String, enum: ['pending','indexed','failed','stale'], default: 'pending' },
  error: { type: String, default: '' }, metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, extractedRules: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
export const ScholarshipSource = mongoose.models.ScholarshipSource || mongoose.model('ScholarshipSource', ScholarshipSourceSchema);
