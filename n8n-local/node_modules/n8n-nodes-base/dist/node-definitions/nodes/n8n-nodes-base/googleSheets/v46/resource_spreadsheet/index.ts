/**
 * Google Sheets - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV46SpreadsheetCreateNode } from './operation_create';
import type { GoogleSheetsV46SpreadsheetDeleteSpreadsheetNode } from './operation_delete_spreadsheet';

export * from './operation_create';
export * from './operation_delete_spreadsheet';

export type GoogleSheetsV46SpreadsheetNode =
  | GoogleSheetsV46SpreadsheetCreateNode
  | GoogleSheetsV46SpreadsheetDeleteSpreadsheetNode
  ;