/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV42SheetAppendNode } from './operation_append';
import type { GoogleSheetsV42SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV42SheetClearNode } from './operation_clear';
import type { GoogleSheetsV42SheetCreateNode } from './operation_create';
import type { GoogleSheetsV42SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV42SheetReadNode } from './operation_read';
import type { GoogleSheetsV42SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV42SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV42SheetNode =
  | GoogleSheetsV42SheetAppendNode
  | GoogleSheetsV42SheetAppendOrUpdateNode
  | GoogleSheetsV42SheetClearNode
  | GoogleSheetsV42SheetCreateNode
  | GoogleSheetsV42SheetDeleteNode
  | GoogleSheetsV42SheetReadNode
  | GoogleSheetsV42SheetRemoveNode
  | GoogleSheetsV42SheetUpdateNode
  ;