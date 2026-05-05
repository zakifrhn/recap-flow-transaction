import { open, type DB } from '@op-engineering/op-sqlite';

let _db: DB | null = null;

export function getDB(): DB {
  if (!_db) {
    _db = open({ name: 'recapflow.db' });
    _db.executeSync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        amount      REAL    NOT NULL,
        type        TEXT    NOT NULL,
        direction   TEXT    NOT NULL,
        merchant    TEXT,
        counterparty TEXT,
        bank        TEXT    NOT NULL,
        source_app  TEXT    NOT NULL,
        category    TEXT    NOT NULL,
        raw_text    TEXT    NOT NULL,
        timestamp   INTEGER NOT NULL,
        created_at  INTEGER NOT NULL
      )
    `);
  }
  return _db;
}
