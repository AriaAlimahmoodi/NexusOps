/**
 * Google Sheets  Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV2SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV2SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV2Node =
  | GoogleSheetsV2SpreadsheetNode
  | GoogleSheetsV2SheetNode
  ;