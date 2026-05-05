import type { RawNotification, ParsedTransaction } from './types';
import { parseBCA } from './bca';
import { parseGoPay } from './gopay';
import { parseOVO } from './ovo';
import { parseDANA } from './dana';
import { parseMandiri } from './mandiri';

// Maps package name to its parser function
const PARSERS: Record<string, (n: RawNotification) => ParsedTransaction | null> = {
  'com.bca':                           parseBCA,
  'com.gojek.app':                     parseGoPay,
  'ovo.id':                            parseOVO,
  'id.dana':                           parseDANA,
  'com.bankmandiri.mandirionline':      parseMandiri,
};

export function parseNotification(notif: RawNotification): ParsedTransaction | null {
  const parser = PARSERS[notif.app];
  if (!parser) return null;
  try {
    return parser(notif);
  } catch {
    return null;
  }
}

export { type RawNotification, type ParsedTransaction };
