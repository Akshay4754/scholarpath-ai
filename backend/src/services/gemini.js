import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
// Every Gemini call gets a timeout: a stalled request must fall back to the deterministic result, never hang a student's check.
export const gemini = () => new GoogleGenAI({ apiKey: env.geminiApiKey, httpOptions: { timeout: env.geminiTimeoutMs } });
