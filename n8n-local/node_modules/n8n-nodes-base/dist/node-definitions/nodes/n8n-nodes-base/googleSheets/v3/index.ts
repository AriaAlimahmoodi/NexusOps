/**
 * Google Sheets Node - Version 3
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV3SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV3SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV3Node =
  | GoogleSheetsV3SpreadsheetNode
  | GoogleSheetsV3SheetNode
  ;