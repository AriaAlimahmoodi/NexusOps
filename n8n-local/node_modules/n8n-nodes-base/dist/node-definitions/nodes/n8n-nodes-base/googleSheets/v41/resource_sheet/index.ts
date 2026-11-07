/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV41SheetAppendNode } from './operation_append';
import type { GoogleSheetsV41SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV41SheetClearNode } from './operation_clear';
import type { GoogleSheetsV41SheetCreateNode } from './operation_create';
import type { GoogleSheetsV41SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV41SheetReadNode } from './operation_read';
import type { GoogleSheetsV41SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV41SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV41SheetNode =
  | GoogleSheetsV41SheetAppendNode
  | GoogleSheetsV41SheetAppendOrUpdateNode
  | GoogleSheetsV41SheetClearNode
  | GoogleSheetsV41SheetCreateNode
  | GoogleSheetsV41SheetDeleteNode
  | GoogleSheetsV41SheetReadNode
  | GoogleSheetsV41SheetRemoveNode
  | GoogleSheetsV41SheetUpdateNode
  ;