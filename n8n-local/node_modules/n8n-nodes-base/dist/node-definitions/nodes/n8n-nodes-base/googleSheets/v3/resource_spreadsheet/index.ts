/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV3SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV3SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV3SpreadsheetNode =
  | GoogleSheetsV3SpreadsheetCreateNode
  | GoogleSheetsV3SpreadsheetDeleteSpreadsheetNode
  ;