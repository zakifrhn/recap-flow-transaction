export type TransactionType =
  | 'QRIS'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'TARIK_TUNAI'
  | 'TOPUP'
  | 'UNKNOWN';

export type Category =
  | 'Makanan & Minuman'
  | 'Transport'
  | 'Belanja'
  | 'Transfer'
  | 'Tarik Tunai'
  | 'Top Up'
  | 'Lainnya';

export interface Transaction {
  id?: number;
  amount: number;
  type: TransactionType;
  direction: 'debit' | 'credit';
  merchant?: string;
  counterparty?: string;
  bank: string;
  source_app: string;
  category: Category;
  raw_text: string;
  timestamp: number;
  created_at: number;
}
