import type { RawNotification, ParsedTransaction } from './types';
import { parseBCA } from './bca';
import { parseGoPay } from './gopay';
import { parseOVO } from './ovo';
import { parseDANA } from './dana';
import { parseMandiri } from './mandiri';
import { parseSeaBank } from './seabank';
import { parseBRI } from './bri';
import { parseBNI } from './bni';
import { parseShopeePay } from './shopee';
import { parseJenius } from './jenius';
import { parseJago } from './jago';

// Maps package name to its parser function
const PARSERS: Record<string, (n: RawNotification) => ParsedTransaction | null> = {
  'com.bca':                           parseBCA,
  'com.gojek.app':                     parseGoPay,
  'ovo.id':                            parseOVO,
  'id.dana':                           parseDANA,
  'com.bankmandiri.mandirionline':      parseMandiri,
  'com.seabank.app':                   parseSeaBank,
  'id.co.bri.brimo':                   parseBRI,
  'com.bni.mobile':                    parseBNI,
  'com.shopee.id':                     parseShopeePay,
  'com.jenius.app':                    parseJenius,
  'com.jago.mobile':                   parseJago,
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

export type { RawNotification, ParsedTransaction } from './types';
