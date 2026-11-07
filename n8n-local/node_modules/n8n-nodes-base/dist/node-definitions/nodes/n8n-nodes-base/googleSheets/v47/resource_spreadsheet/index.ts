/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV47SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV47SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV47SpreadsheetNode =
  | GoogleSheetsV47SpreadsheetCreateNode
  | GoogleSheetsV47SpreadsheetDeleteSpreadsheetNode
  ;