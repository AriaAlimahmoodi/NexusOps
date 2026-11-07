/**
 * Google Sheets Node - Version 4.3
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV43SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV43SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV43Node =
  | GoogleSheetsV43SpreadsheetNode
  | GoogleSheetsV43SheetNode
  ;