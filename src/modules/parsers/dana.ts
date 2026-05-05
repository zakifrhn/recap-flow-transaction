import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: id.dana
// Examples:
//   "Pembayaran berhasil Rp15.000 ke Merchant"
//   "Transfer DANA berhasil\nRp 200.000 ke Budi"
//   "Tarik Tunai berhasil\nRp 300.000 ke BCA"
//   "Top Up DANA berhasil\nRp 100.000"

export function parseDANA(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/tarik\s+tunai/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'DANA',
      category: defaultCategory('TARIK_TUNAI'),
    };
  }

  if (/top.?up/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TOPUP',
      direction: 'credit',
      bank: 'DANA',
      category: defaultCategory('TOPUP'),
    };
  }

  if (/transfer/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const counterparty = text.match(/ke\s+([\w\s]+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'DANA',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  if (/pembayaran|bayar|qris/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/ke\s+(.+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'DANA',
      category: defaultCategory('QRIS'),
    };
  }

  return null;
}
