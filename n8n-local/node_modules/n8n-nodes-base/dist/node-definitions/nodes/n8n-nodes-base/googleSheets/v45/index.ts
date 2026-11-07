/**
 * Google Sheets Node - Version 4.5
 * Re-exports all discriminator combinations.
 */

import type { GoogleSheetsV45SpreadsheetNode } from './resource_spreadsheet';
import type { GoogleSheetsV45SheetNode } from './resource_sheet';

export * from './resource_spreadsheet';
export * from './resource_sheet';

export type GoogleSheetsV45Node =
  | GoogleSheetsV45SpreadsheetNode
  | GoogleSheetsV45SheetNode
  ;