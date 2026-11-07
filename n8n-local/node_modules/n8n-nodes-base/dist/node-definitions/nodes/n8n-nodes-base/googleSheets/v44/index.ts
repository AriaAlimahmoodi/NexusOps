/**
 * Google Sheets Node - Version 4.4
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV44SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV44SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV44Node =
  | GoogleSheetsV44SpreadsheetNode
  | GoogleSheetsV44SheetNode
  ;