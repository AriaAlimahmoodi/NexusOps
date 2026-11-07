/**
 * Google Sheets Node - Version 4
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV4SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV4SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV4Node =
  | GoogleSheetsV4SpreadsheetNode
  | GoogleSheetsV4SheetNode
  ;