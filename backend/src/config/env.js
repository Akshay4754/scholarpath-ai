import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
// Load backend/.env regardless of the working directory; real deployments set variables on the host instead.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
const nodeEnv = process.env.NODE_ENV || 'development';
const trustProxy = process.env.TRUST_PROXY ?? (nodeEnv === 'production' ? '1' : '0');
export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // Number of reverse proxies in front of the app (Render, Railway, Nginx...). Needed for correct client IPs in rate limiting.
  trustProxy: /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true',
  // Built frontend served by the API in single-service deployments. Ignored when the folder has no index.html.
  staticDir: process.env.STATIC_DIR || fileURLToPath(new URL('../../../frontend/dist', import.meta.url)),
  mongoUri: process.env.MONGODB_URI || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 25000),
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'scholarpath-index',
  pineconeNamespace: process.env.PINECONE_NAMESPACE || 'official-scholarships',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  adminApiToken: process.env.ADMIN_API_TOKEN || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || '',
  inngestSigningKey: process.env.INNGEST_SIGNING_KEY || ''
};
