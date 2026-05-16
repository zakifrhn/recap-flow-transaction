import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.bca
// Examples:
//   QRIS:           "Debit melalui QRIS sebesar Rp 25.000,00"
//   Transfer keluar: "Debit melalui m-BCA sebesar Rp 500.000,00"
//                   "Debit melalui BI-Fast sebesar Rp 200.000,00"
//                   "Debit melalui layanan Antar Bank Online sebesar Rp 150.000,00"
//   Tarik tunai:    "Debit penarikan tunai sebesar Rp 300.000,00"
//   Transfer masuk: "Dana masuk sebesar Rp 1.000.000,00"
//                   "Dana masuk melalui layanan BI-Fast sebesar Rp 10.000,00"
//                   "Dana masuk melalui layanan Antar Bank Online sebesar Rp 500.000,00"

export function parseBCA(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/penarikan\s+tunai/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'BCA',
      category: defaultCategory('TARIK_TUNAI'),
    };
  }

  if (/QRIS/i.test(text) && /debit/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      bank: 'BCA',
      category: defaultCategory('QRIS'),
    };
  }

  if (/debit\s+melalui/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      bank: 'BCA',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  if (/dana\s+masuk/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      bank: 'BCA',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  return null;
}
