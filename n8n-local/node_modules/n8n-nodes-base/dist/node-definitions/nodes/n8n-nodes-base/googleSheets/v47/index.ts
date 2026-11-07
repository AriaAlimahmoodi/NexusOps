/**
 * Google Sheets Node - Version 4.7
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV47SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV47SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV47Node =
  | GoogleSheetsV47SpreadsheetNode
  | GoogleSheetsV47SheetNode
  ;