import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config/env.js';
import { api } from './routes/api.js';
import { admin } from './routes/admin.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { serve } from 'inngest/express';
import { inngest, notificationFunctions } from './jobs/inngest.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: {
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'img-src': ["'self'", 'data:'],
    // Platforms terminate TLS and redirect HTTP themselves; forcing upgrades breaks plain-HTTP local/Docker runs.
    'upgrade-insecure-requests': null
  } }
}));
app.use('/api', cors({ origin: env.clientOrigin.split(',').map(x => x.trim()), credentials: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/admin', admin);
app.use('/api/inngest', serve({ client: inngest, functions: notificationFunctions }));
app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Single-service deployment: serve the built React app and let client-side routing handle unknown paths.
const indexHtml = path.join(env.staticDir, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.use('/assets', express.static(path.join(env.staticDir, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(env.staticDir, { index: false, maxAge: '1h' }));
  app.get('/{*path}', (_req, res) => res.set('Cache-Control', 'no-cache').sendFile(indexHtml));
  console.log(`Serving frontend from ${env.staticDir}`);
}

app.use((err, _req, res, _next) => {
  const status = err.name === 'MulterError' || err.status === 400 || err.type === 'entity.parse.failed' ? 400 : 500;
  if (status === 500) console.error('[api-error]', err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.type === 'entity.parse.failed' ? 'Request body is not valid JSON.' : err.message, ...(env.isProduction ? {} : { detail: err.message }) });
});

if (env.mongoUri) {
  const connect = () => mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log('MongoDB connected'))
    .catch(err => { console.error(`MongoDB connection failed: ${err.message}. Retrying in 15s; data stays in memory until connected.`); setTimeout(connect, 15000); });
  connect();
} else if (env.isProduction) {
  console.warn('MONGODB_URI is not set: profiles, applications and agent runs are kept in memory and lost on restart.');
}
if (env.isProduction && !env.adminApiToken) console.warn('ADMIN_API_TOKEN is not set: admin endpoints are disabled.');

const server = app.listen(env.port, () => console.log(`ScholarPath API listening on http://localhost:${env.port} (${env.nodeEnv})`));
const shutdown = signal => {
  console.log(`${signal} received, shutting down`);
  server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
