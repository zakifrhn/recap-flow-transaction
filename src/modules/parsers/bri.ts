import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: id.co.bri.brimo
// Examples:
//   QRIS:              "NBMB QRIS INDOMARET SERPONG Rp 35.000,00"
//   Transfer keluar:   "NBMB TRF KE IRWAN HADI BRI 009XXXXXXXX Rp 100.000,00"
//                      "NBMB TRFHMB DIAN PRATIWI BCA 0123XXXXXXX Rp 200.000,00"
//   Tarik tunai:       "Penarikan Tunai ATM BRI Rp 300.000,00"
//   Transfer masuk:    "CN MASUK KE TABUNGAN Rp 3.000.000,00"
//                      "Sobat BRI! Dana Rp 500.000,00 masuk ke rekening Ket.: TRF DARI BUDI - BCA"

const BANK_NAMES = /\b(BRI|BCA|MANDIRI|BNI|CIMB|DANAMON|PERMATA|BTN|NIAGA|SEABANK)\b/i;

export function parseBRI(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/penarikan\s+tunai/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'BRI',
      category: defaultCategory('TARIK_TUNAI'),
    };
  }

  if (/QRIS/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/QRIS\s+([\w\s]+?)\s+Rp/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'BRI',
      category: defaultCategory('QRIS'),
    };
  }

  if (/CN\s+MASUK/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      bank: 'BRI',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/masuk\s+ke\s+rekening/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const counterparty = text.match(/TRF\s+DARI\s+([\w\s]+?)(?:\s*-\s*\w+\s*$|\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      counterparty,
      bank: 'BRI',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/NBMB\s+TRF/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const afterTrf = text.match(/TRF(?:HMB)?\s+KE\s+([\w\s]+?)\s+(?:KE\s+)?/i)?.[1]
      ?? text.match(/TRFHMB\s+([\w\s]+?)\s+/i)?.[1];
    const counterparty = afterTrf?.replace(BANK_NAMES, '').replace(/\d+[X\d]*/g, '').trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty: counterparty || undefined,
      bank: 'BRI',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  return null;
}
