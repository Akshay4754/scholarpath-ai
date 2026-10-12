import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { gemini } from './gemini.js';
import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../config/env.js';
import { ScholarshipSource } from '../models/ScholarshipSource.js';

const BLOCKED_HOSTS = new Set(['localhost','localhost.localdomain']);
function isPrivateIPv4(ip) { const p=ip.split('.').map(Number); return p.length===4 && (p[0]===10 || p[0]===127 || p[0]===0 || (p[0]===169&&p[1]===254) || (p[0]===172&&p[1]>=16&&p[1]<=31) || (p[0]===192&&p[1]===168) || p[0]>=224); }
export async function assertPublicUrl(raw) {
  const url = new URL(raw);
  if (!['http:','https:'].includes(url.protocol)) throw new Error('Only HTTP/HTTPS source URLs are allowed.');
  if (url.username || url.password) throw new Error('URLs with embedded credentials are not allowed.');
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) throw new Error('Local/private hosts are not allowed.');
  if (url.hostname === '::1' || url.hostname.endsWith('.local')) throw new Error('Local/private hosts are not allowed.');
  if (net.isIP(url.hostname) === 4 && isPrivateIPv4(url.hostname)) throw new Error('Private network URLs are not allowed.');
  const addresses = await dns.lookup(url.hostname, { all: true }).catch(() => []);
  if (!addresses.length) throw new Error('Source hostname did not resolve.');
  for (const a of addresses) {
    if ((a.family === 4 && isPrivateIPv4(a.address)) || (a.family === 6 && (a.address === '::1' || a.address.toLowerCase().startsWith('fc') || a.address.toLowerCase().startsWith('fd') || a.address.toLowerCase().startsWith('fe80:')))) throw new Error('Private network URLs are not allowed.');
  }
  return url;
}
function htmlToText(html) {
 return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#39;/g,"'").replace(/&quot;/gi,'"').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n\n').trim();
}
import { chunkText } from './chunking.service.js';
export { chunkText } from './chunking.service.js';
async function fetchSource(url) {
 const parsed = await assertPublicUrl(url);
 const controller = new AbortController(); const timer=setTimeout(()=>controller.abort(), 18000);
 try {
  const response=await fetch(parsed, { signal:controller.signal, redirect:'manual', headers:{'user-agent':'ScholarPathAI/1.0 (official scholarship source indexing; contact configured by operator)','accept':'text/html,application/pdf,text/plain'} });
  if(response.status>=300&&response.status<400) throw new Error('Redirected source URLs are not followed automatically. Submit the final official URL directly.');
  if(!response.ok) throw new Error(`Source fetch failed with HTTP ${response.status}.`);
  const type=(response.headers.get('content-type')||'').toLowerCase();
  const length=Number(response.headers.get('content-length')||0); if(length>8*1024*1024) throw new Error('Source exceeds 8 MB limit.');
  const buffer=Buffer.from(await response.arrayBuffer()); if(buffer.length>8*1024*1024) throw new Error('Source exceeds 8 MB limit.');
  let text=''; if(type.includes('pdf') || parsed.pathname.toLowerCase().endsWith('.pdf')) { const parsedPdf=await pdfParse(buffer); text=parsedPdf.text||''; }
  else if(type.includes('html') || type.includes('text')) text=htmlToText(buffer.toString('utf8'));
  else throw new Error(`Unsupported content type: ${type || 'unknown'}. Provide HTML, plain text, or PDF.`);
  if(text.length<80) throw new Error('Not enough searchable text was extracted. Scanned PDFs need OCR before indexing.');
  return {text, contentType:type, bytes:buffer.length};
 } finally { clearTimeout(timer); }
}
async function embedBatch(ai, texts) {
 const out=[];
 for(let i=0;i<texts.length;i+=20) {
  for (const text of texts.slice(i,i+20)) {
   const result=await ai.models.embedContent({model:'gemini-embedding-001',contents:text,config:{outputDimensionality:768}});
   const values=result.embeddings?.[0]?.values; if(!values?.length) throw new Error('Embedding provider returned an empty vector.'); out.push(values);
  }
 }
 return out;
}
async function extractCandidateRules(ai, title, text, sourceUrl) {
 const schema={type:'OBJECT',properties:{schemeName:{type:'STRING',nullable:true},provider:{type:'STRING',nullable:true},academicYear:{type:'STRING',nullable:true},deadline:{type:'STRING',nullable:true},award:{type:'STRING',nullable:true},eligibilityRules:{type:'ARRAY',items:{type:'OBJECT',properties:{rule:{type:'STRING'},evidenceQuote:{type:'STRING'},confidence:{type:'STRING',enum:['high','medium','low']}},required:['rule','evidenceQuote','confidence']}},requiredDocuments:{type:'ARRAY',items:{type:'STRING'}},uncertainties:{type:'ARRAY',items:{type:'STRING'}}},required:['eligibilityRules','requiredDocuments','uncertainties']};
 try {
  const response=await ai.models.generateContent({model:env.geminiModel,contents:`Extract candidate scholarship facts from the supplied source. This is not an eligibility decision. Only extract statements explicitly supported by source text; include a short exact evidence quote for every rule. If a fact is absent, omit it and put uncertainty in uncertainties. Do not infer deadlines, amounts, or thresholds. Return JSON only.
Source URL: ${sourceUrl}
Title hint: ${title}
Source text:
${text.slice(0,18000)}`,config:{responseMimeType:'application/json',responseSchema:schema}});
  const parsed=JSON.parse(response.text||'{}');
  return {...parsed,reviewStatus:'unverified_human_review_required',sourceUrl,extractedAt:new Date().toISOString()};
 } catch (error) {
  return {eligibilityRules:[],requiredDocuments:[],uncertainties:[`Candidate rule extraction failed: ${error.message}`],reviewStatus:'unverified_human_review_required',sourceUrl,extractedAt:new Date().toISOString()};
 }
}

export async function ingestOfficialSource(input) {
 const sourceUrl=String(input.sourceUrl||'').trim(); const title=String(input.title||'').trim();
 if(!title || !sourceUrl) throw new Error('title and sourceUrl are required.');
 if(!env.geminiApiKey || !env.pineconeApiKey || !env.pineconeIndexName) throw new Error('Set GEMINI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX_NAME before indexing official sources.');
 const {text,contentType,bytes}=await fetchSource(sourceUrl);
 const contentHash=crypto.createHash('sha256').update(text).digest('hex');
 const chunks=chunkText(text); if(!chunks.length) throw new Error('Source produced no indexable chunks.');
 const ai=gemini(); const [vectors, extractedRules]=await Promise.all([embedBatch(ai,chunks.map(c=>c.text)), extractCandidateRules(ai,title,text,sourceUrl)]);
 const pinecone=new Pinecone({apiKey:env.pineconeApiKey}); const namespace=pinecone.index(env.pineconeIndexName).namespace(env.pineconeNamespace);
 const sourceKey=crypto.createHash('sha1').update(sourceUrl).digest('hex').slice(0,16);
 // Remove previous chunks for this exact URL so changed pages do not leave stale policy text in retrieval.
 try { await namespace.deleteMany({ filter: { sourceUrl: { $eq: sourceUrl } } }); } catch (error) { throw new Error(`Could not replace old source vectors safely: ${error.message}`); }
 const records=chunks.map((c,i)=>({id:`src-${sourceKey}-${contentHash.slice(0,10)}-${i}`,values:vectors[i],metadata:{text:c.text,title,sourceUrl,provider:String(input.provider||''),scholarshipId:String(input.scholarshipId||''),academicYear:String(input.academicYear||''),lastVerifiedAt:input.lastVerifiedAt||new Date().toISOString(),chunkIndex:i,contentHash}}));
 for(let i=0;i<records.length;i+=100) await namespace.upsert({records:records.slice(i,i+100)});
 const data={title,sourceUrl,provider:String(input.provider||''),scholarshipId:String(input.scholarshipId||''),academicYear:String(input.academicYear||''),contentHash,textLength:text.length,chunkCount:chunks.length,lastFetchedAt:new Date(),lastIndexedAt:new Date(),lastVerifiedAt:input.lastVerifiedAt?new Date(input.lastVerifiedAt):new Date(),status:'indexed',error:'',metadata:{contentType,bytes},extractedRules};
 if(ScholarshipSource.db.readyState===1) await ScholarshipSource.findOneAndUpdate({sourceUrl},{$set:data},{upsert:true,new:true,setDefaultsOnInsert:true});
 return {title,sourceUrl,contentHash,textLength:text.length,chunkCount:chunks.length,status:'indexed',lastVerifiedAt:data.lastVerifiedAt,extractedRules};
}
export async function getSourceInventory() { if(ScholarshipSource.db.readyState!==1) return []; return ScholarshipSource.find().sort({updatedAt:-1}).limit(200).lean(); }
