import type { Category, TransactionType } from '../../types';

export interface RawNotification {
  app: string;
  title?: string;
  titleBig?: string;
  text?: string;
  subText?: string;
  summaryText?: string;
  bigText?: string;
  extra?: string;
}

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  direction: 'debit' | 'credit';
  merchant?: string;
  counterparty?: string;
  bank: string;
  category: Category;
}
