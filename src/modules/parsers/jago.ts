import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.jago.mobile
// Examples:
//   Transfer keluar:  "Transfer berhasil Rp 100.000 ke HENDRA - Bank Jago"
//                     "Transfer berhasil Rp 250.000 ke SINTA - BCA 0123XXXXXX"
//   Transfer masuk:   "Kamu menerima Rp 200.000 dari ANDI - Bank Jago"
//                     "Dana masuk Rp 500.000 dari Mandiri ke rekeningmu"
//   QRIS:             "Bayar QRIS berhasil -Rp 35.000 KOPI KENANGAN"
//   Top Up GoPay:     "Top Up GoPay berhasil +Rp 200.000 dari Kantong Jago"

export function parseJago(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  // Top Up GoPay = uang keluar dari Jago ke GoPay
  if (/top\s*up\s+gopay/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty: 'GoPay',
      bank: 'Jago',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  if (/QRIS|bayar\s+qris/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/Rp\s*[\d.,]+\s+(.+)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'Jago',
      category: defaultCategory('QRIS'),
    };
  }

  if (/kamu\s+menerima/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "dari ANDI - Bank Jago" → "ANDI"
    const counterparty = text.match(/dari\s+([\w\s]+?)\s+-/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      counterparty,
      bank: 'Jago',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/dana\s+masuk/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      bank: 'Jago',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/transfer\s+berhasil/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "ke SINTA - BCA ..." or "ke HENDRA - Bank Jago" → "SINTA" / "HENDRA"
    const counterparty = text.match(/ke\s+([\w\s]+?)\s+-/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'Jago',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  return null;
}
