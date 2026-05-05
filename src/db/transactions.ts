import { getDB } from './index';
import type { Transaction } from '../types';

export async function insertTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
  const db = getDB();
  await db.execute(
    `INSERT INTO transactions
      (amount, type, direction, merchant, counterparty, bank, source_app, category, raw_text, timestamp, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.amount,
      tx.type,
      tx.direction,
      tx.merchant ?? null,
      tx.counterparty ?? null,
      tx.bank,
      tx.source_app,
      tx.category,
      tx.raw_text,
      tx.timestamp,
      tx.created_at,
    ],
  );
}

export function getTransactions(limit = 50): Transaction[] {
  const db = getDB();
  const result = db.executeSync(
    'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
    [limit],
  );
  return result.rows as unknown as Transaction[];
}

export function getTodayTotal(): number {
  const db = getDB();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = db.executeSync(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE direction = 'debit' AND timestamp >= ?`,
    [startOfDay.getTime()],
  );
  return (result.rows[0]?.total as number) ?? 0;
}
