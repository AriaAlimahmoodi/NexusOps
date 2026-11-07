/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV42SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV42SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV42SpreadsheetNode =
  | GoogleSheetsV42SpreadsheetCreateNode
  | GoogleSheetsV42SpreadsheetDeleteSpreadsheetNode
  ;