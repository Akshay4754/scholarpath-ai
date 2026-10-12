import mongoose from 'mongoose';
import { ownedRecord } from './ownership.js';
const ProfileSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  state: { type: String, required: true },
  educationLevel: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  institution: String,
  yearOfStudy: { type: Number, min: 1, max: 6 },
  gender: String,
  category: String,
  disabilityPercent: { type: Number, min: 0, max: 100 },
  annualFamilyIncomeINR: { type: Number, min: 0 },
  percentage: { type: Number, min: 0, max: 100 },
  documents: [{ name: String, fileName: String, extractedFields: mongoose.Schema.Types.Mixed, status: { type: String, default: 'uploaded' }, uploadedAt: { type: Date, default: Date.now } }]
}, { timestamps: true });
ownedRecord(ProfileSchema);
export const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
