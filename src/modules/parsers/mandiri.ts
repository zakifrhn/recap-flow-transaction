import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.bankmandiri.mandirionline (Livin' by Mandiri)
// Examples:
//   "Debet Rp500.000 Transfer ke rek. 1234567890"
//   "Kredit Rp200.000 Transfer dari John Doe"
//   "Pembayaran QRIS Rp75.000 berhasil"
//   "Tarik Tunai Rp500.000 berhasil di ATM"

export function parseMandiri(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/QRIS/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/ke\s+(.+?)(?:\s+berhasil|$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'Mandiri',
      category: defaultCategory('QRIS'),
    };
  }

  if (/tarik\s+tunai/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'Mandiri',
      category: defaultCategory('TARIK_TUNAI'),
    };
  }

  if (/debet/i.test(text) && /transfer/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const counterparty = text.match(/ke\s+(?:rek\.\s*)?([\w\s]+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'Mandiri',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  if (/kredit/i.test(text) && /transfer/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const counterparty = text.match(/dari\s+([\w\s]+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      counterparty,
      bank: 'Mandiri',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  return null;
}
