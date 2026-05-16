import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.bni.mobile (Wondr by BNI)
// Examples:
//   QRIS:              "BNI: Debit Rp 28.000 QRIS - WARUNG SOTO BU TUM"
//   Transfer keluar:   "BNI: Debit Rp 150.000 Transfer ke LINDA SUSANTI BNI"
//                      "BNI: Debit Rp 400.000 Transfer BI-Fast ke REZA PRATAMA BCA"
//   Tarik tunai:       "BNI: Debit Rp 200.000 Penarikan Tunai ATM BNI"
//   Transfer masuk:    "BNI: Kredit Rp 500.000 Transfer dari WAHYU SETIAWAN BNI"
//                      "BNI: Kredit Rp 1.000.000 Terima BI-Fast dari AGUS HARIYANTO Mandiri"

const BANK_NAMES = /\s+(?:BRI|BCA|MANDIRI|BNI|CIMB|DANAMON|PERMATA|BTN|NIAGA|SEABANK|Mandiri)\s*$/i;

export function parseBNI(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/penarikan\s+tunai/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'BNI',
      category: defaultCategory('TARIK_TUNAI'),
    };
  }

  if (/QRIS/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/QRIS\s*-\s*(.+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'BNI',
      category: defaultCategory('QRIS'),
    };
  }

  if (/kredit|terima.*dari|transfer\s+dari/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const raw = text.match(/dari\s+([\w\s]+?)(?:\s*$)/i)?.[1]?.trim();
    const counterparty = raw?.replace(BANK_NAMES, '').trim();
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      counterparty: counterparty || undefined,
      bank: 'BNI',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/transfer.*ke|debit.*transfer/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const raw = text.match(/ke\s+([\w\s]+?)(?:\s*$)/i)?.[1]?.trim();
    const counterparty = raw?.replace(BANK_NAMES, '').trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty: counterparty || undefined,
      bank: 'BNI',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  return null;
}
