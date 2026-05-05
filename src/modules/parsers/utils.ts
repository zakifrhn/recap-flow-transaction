import type { Category, TransactionType } from '../../types';

export function parseAmount(text: string): number {
  // Handles: "Rp25.000", "Rp 25.000", "Rp1.500.000", "IDR 25000"
  const match = text.match(/(?:Rp\.?|IDR)\s*([\d.,]+)/i);
  if (!match) return 0;
  // Indonesian format: dots = thousand sep, comma = decimal
  const raw = match[1].replace(/\./g, '').split(',')[0];
  return parseInt(raw, 10) || 0;
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
