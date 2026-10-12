import { env } from '../config/env.js';
import { Pinecone } from '@pinecone-database/pinecone';
import { gemini } from './gemini.js';
let pineconeIndex;
function getIndex() {
  if (!env.pineconeApiKey || !env.pineconeIndexName) return null;
  if (!pineconeIndex) pineconeIndex = new Pinecone({ apiKey: env.pineconeApiKey }).index(env.pineconeIndexName);
  return pineconeIndex;
}
export async function retrieveOfficialEvidence({ query, scholarshipId, topK = 5 }) {
  const index = getIndex();
  if (!index || !env.geminiApiKey) return { configured: false, matches: [], note: 'Official-document retrieval is not configured; the catalogue record and its linked source are used instead.' };
  try {
    const ai = gemini();
    const embedding = await ai.models.embedContent({ model: 'gemini-embedding-001', contents: query, config: { outputDimensionality: 768 } });
    const values = embedding.embeddings?.[0]?.values;
    if (!values?.length) throw new Error('Embedding provider returned no vector');
    const namespace = index.namespace(env.pineconeNamespace);
    const result = await namespace.query({ vector: values, topK, includeMetadata: true, filter: scholarshipId ? { scholarshipId: { $eq: scholarshipId } } : undefined });
    return { configured: true, matches: (result.matches || []).map(m => ({ id: m.id, score: m.score, text: m.metadata?.text || '', sourceUrl: m.metadata?.sourceUrl || '', title: m.metadata?.title || '', academicYear: m.metadata?.academicYear || '', lastVerifiedAt: m.metadata?.lastVerifiedAt || null })) };
  } catch (error) {
    return { configured: true, matches: [], note: `Retrieval failed safely: ${error.message}` };
  }
}
