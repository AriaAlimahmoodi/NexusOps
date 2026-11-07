/**
 * Google Sheets  - Spreadsheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV2SpreadsheetCreateNode } from './operation_create';

export * from './operation_create';

export type GoogleSheetsV2SpreadsheetNode = GoogleSheetsV2SpreadsheetCreateNode;