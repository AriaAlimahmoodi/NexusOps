/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV43SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV43SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV43SpreadsheetNode =
  | GoogleSheetsV43SpreadsheetCreateNode
  | GoogleSheetsV43SpreadsheetDeleteSpreadsheetNode
  ;