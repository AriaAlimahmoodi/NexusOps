/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV4SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV4SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV4SpreadsheetNode =
  | GoogleSheetsV4SpreadsheetCreateNode
  | GoogleSheetsV4SpreadsheetDeleteSpreadsheetNode
  ;