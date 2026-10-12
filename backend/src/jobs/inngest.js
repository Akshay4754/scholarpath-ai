import { Inngest } from 'inngest';
import { sendNotification } from '../services/notification.service.js';
export const inngest = new Inngest({id:'scholarpath-ai'});
export const notificationFunctions = [inngest.createFunction({id:'send-student-notification',retries:3}, {event:'scholarpath/notification.requested'}, async ({event,step}) => step.run('send-email', async()=>sendNotification(event.data)))];
