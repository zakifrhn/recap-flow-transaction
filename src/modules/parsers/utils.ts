import type { Category, TransactionType } from '../../types';

export function parseAmount(text: string): number {
  // Handles Indonesian (Rp 10.000,00) and international (Rp 10,000.00) formats
  const match = /(?:Rp\.?|IDR)\s*([\d.,]+)/i.exec(text);
  if (!match) return 0;
  const raw = match[1];
  const lastDot = raw.lastIndexOf('.');
  const lastComma = raw.lastIndexOf(',');

  let normalized: string;
  if (lastDot > lastComma && raw.slice(lastDot + 1).length === 2) {
    // International: 10,000.00 — dot is decimal, comma is thousands
    normalized = raw.replaceAll(',', '').split('.')[0];
  } else {
    // Indonesian: 10.000,00 or 10.000 — dot is thousands, comma is decimal
    normalized = raw.replaceAll('.', '').split(',')[0];
  }
  return Number.parseInt(normalized, 10) || 0;
}

export function defaultCategory(type: TransactionType): Category {
  switch (type) {
    case 'QRIS':        return 'Makanan & Minuman';
    case 'TRANSFER_OUT':
    case 'TRANSFER_IN': return 'Transfer';
    case 'TARIK_TUNAI': return 'Tarik Tunai';
    case 'TOPUP':       return 'Top Up';
    default:            return 'Lainnya';
  }
}
