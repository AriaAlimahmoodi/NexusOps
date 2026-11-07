/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV41SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV41SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV41SpreadsheetNode =
  | GoogleSheetsV41SpreadsheetCreateNode
  | GoogleSheetsV41SpreadsheetDeleteSpreadsheetNode
  ;