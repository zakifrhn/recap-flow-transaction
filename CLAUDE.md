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
```

## Architecture

This is a React Native (Android-only) personal finance tracker that auto-captures transactions by reading push notifications from banking apps — no manual input required.

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
- Permission must be granted by the user in Android system settings (Notification Access), not a runtime permission — the app prompts with a banner on the Home screen

### Parsers (`src/modules/parsers/`)

Each bank has its own parser file keyed to an Android package name. The dispatcher in `index.ts` routes by `notif.app` (package name). Supported banks: BCA (`com.bca`), GoPay (`com.gojek.app`), OVO (`ovo.id`), DANA (`id.dana`), Mandiri (`com.bankmandiri.mandirionline`).

To add a new bank: create `src/modules/parsers/<bank>.ts` and add its package name entry in `src/modules/parsers/index.ts`.

### Database (`src/db/`)

op-sqlite v15 — `execute()` is async, `executeSync()` is sync. `QueryResult.rows` is a plain `Array<Record<string, Scalar>>`. DB is opened lazily via `getDB()` singleton in `src/db/index.ts`.

### Types

`src/types.ts` defines `Transaction`, `TransactionType`, and `Category` — the shared types used across parsers, DB, and UI.
