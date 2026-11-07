/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV44SheetAppendNode } from './operation_append';
import type { GoogleSheetsV44SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV44SheetClearNode } from './operation_clear';
import type { GoogleSheetsV44SheetCreateNode } from './operation_create';
import type { GoogleSheetsV44SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV44SheetReadNode } from './operation_read';
import type { GoogleSheetsV44SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV44SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV44SheetNode =
  | GoogleSheetsV44SheetAppendNode
  | GoogleSheetsV44SheetAppendOrUpdateNode
  | GoogleSheetsV44SheetClearNode
  | GoogleSheetsV44SheetCreateNode
  | GoogleSheetsV44SheetDeleteNode
  | GoogleSheetsV44SheetReadNode
  | GoogleSheetsV44SheetRemoveNode
  | GoogleSheetsV44SheetUpdateNode
  ;