import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.seabank.app
// Examples:
//   Transfer keluar:  "Transfer Berhasil Rp 150.000 ke PUTRI - SeaBank"
//                     "Transfer Berhasil Rp 300.000 ke ALDI - BNI 0198XXXXXX"
//                     "Transfer Berhasil Rp 100.000 ke ShopeePay"
//   Transfer masuk:   "Dana Masuk Rp 200.000 dari FARIZ - SeaBank"
//                     "Dana Masuk Rp 400.000 dari BCA ke rekeningmu"
//   QRIS:             "Pembayaran QRIS Berhasil -Rp 28.000 INDOMARET PAGEDANGAN"

export function parseSeaBank(notif: RawNotification): ParsedTransaction | null {
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
      bank: 'SeaBank',
      category: defaultCategory('QRIS'),
    };
  }

  if (/dana\s+masuk/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "dari FARIZ - SeaBank" → "FARIZ", "dari BCA ke rekeningmu" → undefined
    const counterparty = text.match(/dari\s+([\w\s]+?)\s+-/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      counterparty,
      bank: 'SeaBank',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/transfer\s+berhasil/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "ke PUTRI - SeaBank" → "PUTRI", "ke ShopeePay" → "ShopeePay"
    const counterparty = text.match(/ke\s+([\w\s]+?)\s*(?:-|$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'SeaBank',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  return null;
}
