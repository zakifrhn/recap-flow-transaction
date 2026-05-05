import type { ParsedTransaction, RawNotification } from './types';
import { defaultCategory, parseAmount } from './utils';

// Package: com.gojek.app
// Examples:
//   title: "Pembayaran berhasil", text: "Rp 25.000 ke Warung Makan ABC"
//   title: "Transfer berhasil",   text: "Rp 100.000 ke 0812xxx"
//   title: "GoPay",               text: "Kamu telah membayar Rp 25.000 via QRIS"
//   title: "Top Up berhasil",     text: "GoPay kamu bertambah Rp 100.000"

export function parseGoPay(notif: RawNotification): ParsedTransaction | null {
  const title = (notif.title ?? '').toLowerCase();
  const text = [notif.text, notif.bigText].filter(Boolean).join(' ');
  const full = `${title} ${text}`;

  if (/top.?up/i.test(full)) {
    const amount = parseAmount(full);
    if (!amount) return null;
    return {
      amount,
      type: 'TOPUP',
      direction: 'credit',
      bank: 'GoPay',
      category: defaultCategory('TOPUP'),
    };
  }

  if (/tarik\s+tunai/i.test(full)) {
    const amount = parseAmount(full);
    if (!amount) return null;
    return {
      amount,
      type: 'TARIK_TUNAI',
      direction: 'debit',
      bank: 'GoPay',
      category: defaultCategory('TARIK_TUNAI'),
    };
  }

  if (/transfer/i.test(title)) {
    const amount = parseAmount(full);
    if (!amount) return null;
    const counterparty = text.match(/ke\s+([\w\s+()-]+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'TRANSFER_OUT',
      direction: 'debit',
      counterparty,
      bank: 'GoPay',
      category: defaultCategory('TRANSFER_OUT'),
    };
  }

  if (/pembayaran|bayar|qris/i.test(full)) {
    const amount = parseAmount(full);
    if (!amount) return null;
    const merchant = text.match(/ke\s+(.+?)(?:\s*$)/i)?.[1]?.trim();
    return {
      amount,
      type: 'QRIS',
      direction: 'debit',
      merchant,
      bank: 'GoPay',
      category: defaultCategory('QRIS'),
    };
  }

  return null;
}
