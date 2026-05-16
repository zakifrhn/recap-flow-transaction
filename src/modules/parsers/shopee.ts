import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.shopee.id
// Examples:
//   QRIS:           "Pembayaran Berhasil ShopeePay -Rp 55.000 ALFAMART SERPONG"
//   Transfer keluar:"Transfer ShopeePay Berhasil -Rp 70.000 ke RINI (0878xxxxxx)"
//                   "Transfer Berhasil -Rp 100.000 ke OVO/DANA/GoPay"
//   Tarik ke bank:  "Penarikan Dana Berhasil -Rp 300.000 ke BCA 0123XXXXXXX"
//   Transfer masuk: "Saldo Diterima +Rp 100.000 dari DENNY (0813xxxxxx)"
//   Top up:         "Top Up Berhasil +Rp 200.000 dari BCA Virtual Account"

export function parseShopeePay(notif: RawNotification): ParsedTransaction | null {
  const text = [notif.text, notif.bigText, notif.title].filter(Boolean).join(' ');

  if (/top\s*up\s+berhasil/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TOPUP',
      direction: 'credit',
      bank: 'ShopeePay',
      category: defaultCategory('TOPUP'),
    };
  }

  if (/penarikan\s+dana\s+berhasil/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'ShopeePay',
      category: defaultCategory('TARIK_TUNAI'),
    };
  }

  if (/saldo\s+diterima/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "dari DENNY (0813xxxxxx)" → "DENNY"
    const counterparty = text.match(/dari\s+([\w\s]+?)(?:\s*\(\d|\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_IN',
      direction: 'credit',
      counterparty,
      bank: 'ShopeePay',
      category: defaultCategory('TRANSFER_IN'),
    };
  }

  if (/pembayaran\s+berhasil/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchant = text.match(/Rp\s*[\d.,]+\s+(.+)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'ShopeePay',
      category: defaultCategory('QRIS'),
    };
  }

  if (/transfer.*berhasil/i.test(text)) {
    const amount = parseAmount(text);
    if (!amount) return null;
    // "ke RINI (0878xxxxxx)" → "RINI", "ke OVO/DANA/GoPay" → "OVO/DANA/GoPay"
    const counterparty = text.match(/ke\s+([\w/\s]+?)(?:\s*\(\d|\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'ShopeePay',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  return null;
}
