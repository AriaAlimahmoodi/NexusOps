/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV44SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV44SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV44SpreadsheetNode =
  | GoogleSheetsV44SpreadsheetCreateNode
  | GoogleSheetsV44SpreadsheetDeleteSpreadsheetNode
  ;