# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Metro bundler
npm start

# Run on Android (requires emulator or connected device)
npm run android

# TypeScript type check
npx tsc --noEmit

# Lint
npm run lint

# Run tests
npm test

# Build release APK
npm run build:android
```

## Architecture

This is a React Native (Android-only) personal finance tracker that auto-captures transactions by reading push notifications from banking apps — no manual input required. Single-screen app; no navigation stack.

### Core flow

```
Android NotificationListenerService
    ↓
HeadlessJS task (index.js → src/modules/notification/headless.ts)
    ↓
parseNotification() → per-bank regex parser (src/modules/parsers/)
    ↓
insertTransaction() → SQLite via op-sqlite (src/db/)
    ↓
HomeScreen reads DB on focus/pull-to-refresh
```

### Notification capture

- `react-native-android-notification-listener` provides the `NotificationListenerService` registered in `android/app/src/main/AndroidManifest.xml`
- The headless task is registered in `index.js` **before** `AppRegistry.registerComponent` — this order matters
- Permission is not a runtime permission — it must be granted in Android Settings > Apps > Notification Access; the app shows a banner if not granted

### Parsers (`src/modules/parsers/`)

Each bank has its own parser file keyed to an Android package name. The dispatcher in `index.ts` routes by `notif.app` (package name). Supported banks: BCA (`com.bca`), GoPay (`com.gojek.app`), OVO (`ovo.id`), DANA (`id.dana`), Mandiri (`com.bankmandiri.mandirionline`).

Each parser receives a `RawNotification` and returns `ParsedTransaction | null`. The pattern:
1. Concatenate notification fields (title, text, bigText) into one string
2. Regex-match for transaction keywords (case-insensitive)
3. Extract amount via `parseAmount()` from `src/modules/parsers/utils.ts`
4. Extract merchant/counterparty via capturing groups
5. Return `null` if no pattern matches

`parseAmount()` handles Indonesian Rupiah format (`Rp25.000`, `Rp 1.500.000`, `IDR 25000`) — dots are thousands separators, commas are decimal; the function returns an integer.

To add a new bank: create `src/modules/parsers/<bank>.ts` and register its package name in the `PARSERS` object in `src/modules/parsers/index.ts`.

### Database (`src/db/`)

op-sqlite v15 — `execute()` is async, `executeSync()` is sync. `QueryResult.rows` is a plain `Array<Record<string, Scalar>>`. DB is opened lazily via `getDB()` singleton in `src/db/index.ts` (synchronous init, creates table on first call).

Schema (single table `transactions`):

```sql
id           INTEGER PRIMARY KEY AUTOINCREMENT
amount       REAL    NOT NULL
type         TEXT    NOT NULL   -- TransactionType enum value
direction    TEXT    NOT NULL   -- 'debit' | 'credit'
merchant     TEXT               -- populated for QRIS transactions
counterparty TEXT               -- populated for transfers
bank         TEXT    NOT NULL   -- e.g. 'BCA', 'GoPay'
source_app   TEXT    NOT NULL   -- Android package name
category     TEXT    NOT NULL
raw_text     TEXT    NOT NULL   -- joined notification fields for audit
timestamp    INTEGER NOT NULL   -- ms since epoch
created_at   INTEGER NOT NULL
```

### Types (`src/types.ts`)

`TransactionType` values: `'QRIS' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'TARIK_TUNAI' | 'TOPUP' | 'UNKNOWN'`

`Category` values: `'Makanan & Minuman' | 'Transport' | 'Belanja' | 'Transfer' | 'Tarik Tunai' | 'Top Up' | 'Lainnya'`

`defaultCategory()` in `src/modules/parsers/utils.ts` maps each `TransactionType` to its default `Category`.
