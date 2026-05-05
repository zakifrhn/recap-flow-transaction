import { parseNotification, type RawNotification } from '../parsers';
import { insertTransaction } from '../../db/transactions';

export default async function notificationHeadlessTask(
  notif: RawNotification,
): Promise<void> {
  const parsed = parseNotification(notif);
  if (!parsed) return;

  const now = Date.now();
  await insertTransaction({
    ...parsed,
    source_app: notif.app,
    raw_text: [notif.text, notif.bigText, notif.title].filter(Boolean).join(' | '),
    timestamp: now,
    created_at: now,
  });
}
