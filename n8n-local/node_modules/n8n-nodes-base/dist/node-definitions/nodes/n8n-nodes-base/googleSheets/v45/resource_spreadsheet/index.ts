/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV45SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV45SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV45SpreadsheetNode =
  | GoogleSheetsV45SpreadsheetCreateNode
  | GoogleSheetsV45SpreadsheetDeleteSpreadsheetNode
  ;