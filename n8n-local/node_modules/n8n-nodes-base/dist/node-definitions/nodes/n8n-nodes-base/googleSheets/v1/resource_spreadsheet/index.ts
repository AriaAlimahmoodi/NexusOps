/**
 * Google Sheets  - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV1SpreadsheetCreateNode } from './operation_create';

export * from './operation_create';

export type GoogleSheetsV1SpreadsheetNode = GoogleSheetsV1SpreadsheetCreateNode;