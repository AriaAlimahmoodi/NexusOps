/**
 * Google Sheets Node - Version 4.2
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV42SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV42SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV42Node =
  | GoogleSheetsV42SpreadsheetNode
  | GoogleSheetsV42SheetNode
  ;