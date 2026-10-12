import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { ingestOfficialSource, getSourceInventory } from '../services/sourceIngestion.service.js';
import { inspectPublicPage } from '../services/portalCheck.service.js';
import { env } from '../config/env.js';
import { inngest } from '../jobs/inngest.js';
export const admin = Router();
function requireAdmin(req,res,next){ if(!env.adminApiToken) return res.status(503).json({error:'Set ADMIN_API_TOKEN before using admin endpoints.'}); const token=Buffer.from(String(req.get('x-admin-token')||'')); const expected=Buffer.from(env.adminApiToken); if(token.length!==expected.length || !crypto.timingSafeEqual(token,expected)) return res.status(401).json({error:'Invalid admin token.'}); next(); }
const SourceInput=z.object({title:z.string().min(3).max(200),sourceUrl:z.string().url(),provider:z.string().max(200).optional(),scholarshipId:z.string().max(100).optional(),academicYear:z.string().max(30).optional(),lastVerifiedAt:z.string().datetime().optional()});
admin.use(requireAdmin);
admin.get('/sources',async(_req,res,next)=>{try{res.json({items:await getSourceInventory()});}catch(e){next(e);}});
admin.post('/sources/ingest',async(req,res,next)=>{const parsed=SourceInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid source metadata',details:parsed.error.flatten()});try{const result=await ingestOfficialSource(parsed.data);res.status(201).json({source:result,note:'Fetched and indexed content from the supplied URL. The source owner and current applicability still require human verification.'});}catch(e){next(e);}});
admin.post('/sources/inspect-page',async(req,res,next)=>{const parsed=z.object({url:z.string().url()}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'A valid URL is required.'});try{res.json({inspection:await inspectPublicPage(parsed.data.url)});}catch(e){next(e);}});

admin.post('/notifications/send',async(req,res,next)=>{const parsed=z.object({to:z.string().email(),subject:z.string().min(2).max(180),text:z.string().min(1).max(10000)}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid notification payload',details:parsed.error.flatten()});try{const result=await inngest.send({name:'scholarpath/notification.requested',data:parsed.data});res.status(202).json({queued:true,ids:result.ids||[],note:'Notification queued. It is sent only when the Inngest function is running and SMTP is configured.'});}catch(e){next(e);}});
