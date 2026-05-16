import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.jenius.app
// Examples:
//   Transfer keluar:  "Berhasil kirim Rp 150.000 ke $cashtag RIZKY"
//                     "Berhasil kirim Rp 200.000 ke BCA 1234XXXXX a.n BUDI"
//   Transfer masuk:   "Kamu terima Rp 300.000 dari $cashtag MAYA"
//                     "Rp 500.000 masuk ke rekeningmu dari BRI"
//   QRIS:             "Pembayaran QRIS Berhasil -Rp 45.000 STARBUCKS SUDIRMAN"

export function parseJenius(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/pembayaran\s+QRIS/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/Rp\s*[\d.,]+\s+(.+)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'Jenius',
      category: defaultCategory('QRIS'),
    };
  }

  if (/masuk\s+ke\s+rekeningmu/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      bank: 'Jenius',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/kamu\s+terima/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "dari $cashtag MAYA" → "MAYA"
    const counterparty = text.match(/dari\s+\$cashtag\s+(\w+)/i)?.[1]
      ?? text.match(/dari\s+([\w\s]+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      counterparty,
      bank: 'Jenius',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/berhasil\s+kirim/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "ke $cashtag RIZKY" → "RIZKY", "ke BCA ... a.n BUDI" → "BUDI"
    const counterparty = text.match(/ke\s+\$cashtag\s+(\w+)/i)?.[1]
      ?? text.match(/a\.n\s+([\w\s]+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'Jenius',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  return null;
}
