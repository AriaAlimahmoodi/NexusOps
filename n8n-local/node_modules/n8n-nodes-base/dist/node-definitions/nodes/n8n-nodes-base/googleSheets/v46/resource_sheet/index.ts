/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV46SheetAppendNode } from './operation_append';
import type { GoogleSheetsV46SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV46SheetClearNode } from './operation_clear';
import type { GoogleSheetsV46SheetCreateNode } from './operation_create';
import type { GoogleSheetsV46SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV46SheetReadNode } from './operation_read';
import type { GoogleSheetsV46SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV46SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV46SheetNode =
  | GoogleSheetsV46SheetAppendNode
  | GoogleSheetsV46SheetAppendOrUpdateNode
  | GoogleSheetsV46SheetClearNode
  | GoogleSheetsV46SheetCreateNode
  | GoogleSheetsV46SheetDeleteNode
  | GoogleSheetsV46SheetReadNode
  | GoogleSheetsV46SheetRemoveNode
  | GoogleSheetsV46SheetUpdateNode
  ;