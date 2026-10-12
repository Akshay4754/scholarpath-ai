import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
export async function sendNotification({to,subject,text,html}) {
 if(!env.smtpHost||!env.smtpFrom) return {sent:false,reason:'SMTP is not configured.'};
 const transport=nodemailer.createTransport({host:env.smtpHost,port:env.smtpPort,secure:env.smtpSecure,user:env.smtpUser,password:env.smtpPassword,auth:env.smtpUser?{user:env.smtpUser,pass:env.smtpPassword}:undefined});
 await transport.sendMail({from:env.smtpFrom,to,subject,text,html}); return {sent:true};
}
