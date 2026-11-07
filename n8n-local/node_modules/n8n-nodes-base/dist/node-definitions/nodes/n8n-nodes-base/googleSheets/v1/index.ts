/**
 * Google Sheets  Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV1SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV1SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV1Node =
  | GoogleSheetsV1SpreadsheetNode
  | GoogleSheetsV1SheetNode
  ;