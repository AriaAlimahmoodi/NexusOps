/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV47SheetAppendNode } from './operation_append';
import type { GoogleSheetsV47SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV47SheetClearNode } from './operation_clear';
import type { GoogleSheetsV47SheetCreateNode } from './operation_create';
import type { GoogleSheetsV47SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV47SheetReadNode } from './operation_read';
import type { GoogleSheetsV47SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV47SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV47SheetNode =
  | GoogleSheetsV47SheetAppendNode
  | GoogleSheetsV47SheetAppendOrUpdateNode
  | GoogleSheetsV47SheetClearNode
  | GoogleSheetsV47SheetCreateNode
  | GoogleSheetsV47SheetDeleteNode
  | GoogleSheetsV47SheetReadNode
  | GoogleSheetsV47SheetRemoveNode
  | GoogleSheetsV47SheetUpdateNode
  ;