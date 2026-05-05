import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: ovo.id
// Examples:
//   "Pembayaran OVO Cash berhasil\nRp 50.000 ke Merchant ABC"
//   "Transfer OVO Cash berhasil\nRp 100.000 ke Budi"
//   "Tarik Tunai berhasil\nRp 500.000 dari Rekening BCA"
//   "Top Up OVO berhasil\nRp 200.000"

export function parseOVO(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/tarik\s+tunai/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'OVO',
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
      bank: 'OVO',
      category: defaultCategory('TOPUP'),
    };
  }

  if (/transfer/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const counterparty = text.match(/ke\s+([\w\s]+?)(?:\s+dari|\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'OVO',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  if (/pembayaran|bayar/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/ke\s+(.+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'OVO',
      category: defaultCategory('QRIS'),
    };
  }

  return null;
}
