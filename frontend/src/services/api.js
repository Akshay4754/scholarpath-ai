// Same-origin '/api' by default (Vite proxies it in development; the API serves the app in production).
// Set VITE_API_BASE_URL only when the frontend is hosted separately from the API.
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const KEY_STORAGE = 'scholarpath-client-key';
let memoryKey;
const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
// A random per-browser key that scopes this visitor's saved profile, applications and agent runs on the server.
function clientKey() {
  try {
    let key = localStorage.getItem(KEY_STORAGE);
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(key || '')) { key = randomKey(); localStorage.setItem(KEY_STORAGE, key); }
    return key;
  } catch { return (memoryKey ??= randomKey()); }
}
async function request(path, { body, method = body ? 'POST' : 'GET' } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(`${BASE}${path}`, { method, headers: { 'x-client-key': clientKey(), ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}) }, body: body && !isForm ? JSON.stringify(body) : body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}
const id = value => encodeURIComponent(value);
export const api = {
  health: () => request('/health'),
  meta: () => request('/meta'),
  scholarships: (params = {}) => request(`/scholarships?${new URLSearchParams(params)}`),
  myProfile: () => request('/profile'),
  saveProfile: profile => request('/profile', { body: profile }),
  assess: (profile, scholarshipId) => request('/eligibility/assess', { body: { profile, scholarshipId } }),
  nextAction: payload => request('/agent/next-action', { body: payload }),
  listApplications: () => request('/applications'),
  createApplication: payload => request('/applications', { body: payload }),
  updateApplicationTask: (appId, taskId, status) => request(`/applications/${id(appId)}/tasks/${id(taskId)}`, { method: 'PATCH', body: { status } }),
  extractDocument: file => { const data = new FormData(); data.append('document', file); return request('/documents/extract', { body: data }); },
  startAgentRun: payload => request('/agent-runs', { body: payload }),
  getAgentRun: runId => request(`/agent-runs/${id(runId)}`),
  answerAgentQuestion: (runId, answer) => request(`/agent-runs/${id(runId)}/respond`, { body: { answer } }),
  updateAgentTask: (runId, index, status) => request(`/agent-runs/${id(runId)}/checklist/${index}`, { method: 'PATCH', body: { status } }),
  approveAgentDraft: runId => request(`/agent-runs/${id(runId)}/approve-draft`, { body: {} })
};
