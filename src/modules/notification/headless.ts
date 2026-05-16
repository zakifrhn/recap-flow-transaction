import { parseNotification, type RawNotification } from '../parsers';
import { insertTransaction } from '../../db/transactions';

export default async function notificationHeadlessTask(
  data: { notification: string },
): Promise<void> {
  const notif: RawNotification = JSON.parse(data.notification);
  console.log('[RecapFlow] notif received:', JSON.stringify({
    app: notif.app,
    title: notif.title,
    text: notif.text,
    bigText: notif.bigText,
  }));

  const parsed = parseNotification(notif);

  if (!parsed) {
    console.log('[RecapFlow] no parser matched for app:', notif.app);
    return;
  }

  console.log('[RecapFlow] parsed:', JSON.stringify(parsed));

  const now = Date.now();
  await insertTransaction({
    ...parsed,
    source_app: notif.app,
    raw_text: [notif.text, notif.bigText, notif.title].filter(Boolean).join(' | '),
    timestamp: now,
    created_at: now,
  });

  console.log('[RecapFlow] saved to DB');
}
