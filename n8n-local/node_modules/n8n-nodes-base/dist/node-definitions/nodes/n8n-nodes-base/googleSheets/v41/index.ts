/**
 * Google Sheets Node - Version 4.1
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV41SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV41SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV41Node =
  | GoogleSheetsV41SpreadsheetNode
  | GoogleSheetsV41SheetNode
  ;