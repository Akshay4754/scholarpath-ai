import fs from 'node:fs/promises';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { gemini } from './gemini.js';
import { env } from '../config/env.js';

export async function extractDocument(file) {
 const buffer=await fs.readFile(file.path); let text=''; let extractionMethod='heuristic-text';
 if(file.mimetype==='application/pdf') { try { text=(await pdfParse(buffer)).text||''; } catch { text=''; } }
 if(file.mimetype.startsWith('image/') || (file.mimetype==='application/pdf' && text.trim().length<50)) {
  if(env.geminiApiKey) {
   const ai=gemini();
   const mimeType=file.mimetype==='application/pdf'?'application/pdf':file.mimetype;
   const prompt='Extract readable text and candidate facts from this student document. Return JSON with keys documentType, fullName, annualFamilyIncomeINR, percentage, institution, academicYear, issueDate, expiryDate, text, uncertaintyNotes. Use null for fields not explicitly supported by the document. Never guess. OCR output must be treated as unverified. For annualFamilyIncomeINR and percentage use numbers or null.';
   const response=await ai.models.generateContent({model:env.geminiModel,contents:[{inlineData:{mimeType,data:buffer.toString('base64')}}, {text:prompt}],config:{responseMimeType:'application/json'}});
   const raw=JSON.parse(response.text||'{}'); text=String(raw.text||''); extractionMethod='gemini-multimodal-ocr';
   return {text,extractedFields:{documentType:raw.documentType||null,fullName:raw.fullName||null,annualFamilyIncomeINR:validNum(raw.annualFamilyIncomeINR),percentage:validPercentage(raw.percentage),institution:raw.institution||null,academicYear:raw.academicYear||null,issueDate:raw.issueDate||null,expiryDate:raw.expiryDate||null,uncertaintyNotes:Array.isArray(raw.uncertaintyNotes)?raw.uncertaintyNotes:[]},extractionMethod,needsHumanReview:true};
  }
 }
 const fields={}; const income=text.match(/(?:annual\s+)?(?:family\s+)?income[^\d₹]{0,30}[₹Rs.\s]*([\d,]+)/i); if(income) fields.annualFamilyIncomeINR=Number(income[1].replace(/,/g,''));
 const pct=text.match(/(\d{1,3}(?:\.\d{1,2})?)\s*%/); if(pct&&Number(pct[1])<=100) fields.percentage=Number(pct[1]);
 return {text,extractedFields:fields,extractionMethod,needsHumanReview:true,warning:text.trim()?'Rule-based extraction is unverified. Confirm every field manually.': 'No searchable text found. Configure GEMINI_API_KEY to enable multimodal OCR for scans/images.'};
}
function validNum(v){const n=Number(v);return v!==null&&v!==''&&Number.isFinite(n)&&n>=0?n:null;}
function validPercentage(v){const n=validNum(v);return n!==null&&n<=100?n:null;}
