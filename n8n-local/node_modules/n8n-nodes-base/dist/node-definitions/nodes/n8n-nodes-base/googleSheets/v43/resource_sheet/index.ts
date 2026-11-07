/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV43SheetAppendNode } from './operation_append';
import type { GoogleSheetsV43SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV43SheetClearNode } from './operation_clear';
import type { GoogleSheetsV43SheetCreateNode } from './operation_create';
import type { GoogleSheetsV43SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV43SheetReadNode } from './operation_read';
import type { GoogleSheetsV43SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV43SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV43SheetNode =
  | GoogleSheetsV43SheetAppendNode
  | GoogleSheetsV43SheetAppendOrUpdateNode
  | GoogleSheetsV43SheetClearNode
  | GoogleSheetsV43SheetCreateNode
  | GoogleSheetsV43SheetDeleteNode
  | GoogleSheetsV43SheetReadNode
  | GoogleSheetsV43SheetRemoveNode
  | GoogleSheetsV43SheetUpdateNode
  ;