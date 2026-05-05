import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.bca
// Examples:
//   "Debet Rp1.500.000 Transfer ke 1234567890"
//   "Kredit Rp500.000 Transfer dari Budi"
//   "Pembayaran QRIS Rp25.000 ke Warung Makan Enak berhasil"

export function parseBCA(notif: RawNotification): ParsedTransaction | null {
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
      bank: 'BCA',
      category: defaultCategory('QRIS'),
    };
  }

  if (/debet/i.test(text) && /transfer/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const counterparty = text.match(/ke\s+([\w\s]+?)(?:\s+oleh|\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'BCA',
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
      bank: 'BCA',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  return null;
}
