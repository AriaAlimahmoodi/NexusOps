/**
 * Google Sheets Node - Version 4.6
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV46SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV46SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV46Node =
  | GoogleSheetsV46SpreadsheetNode
  | GoogleSheetsV46SheetNode
  ;