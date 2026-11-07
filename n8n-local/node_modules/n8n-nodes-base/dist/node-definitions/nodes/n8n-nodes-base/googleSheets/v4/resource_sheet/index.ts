/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV4SheetAppendNode } from './operation_append';
import type { GoogleSheetsV4SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV4SheetClearNode } from './operation_clear';
import type { GoogleSheetsV4SheetCreateNode } from './operation_create';
import type { GoogleSheetsV4SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV4SheetReadNode } from './operation_read';
import type { GoogleSheetsV4SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV4SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV4SheetNode =
  | GoogleSheetsV4SheetAppendNode
  | GoogleSheetsV4SheetAppendOrUpdateNode
  | GoogleSheetsV4SheetClearNode
  | GoogleSheetsV4SheetCreateNode
  | GoogleSheetsV4SheetDeleteNode
  | GoogleSheetsV4SheetReadNode
  | GoogleSheetsV4SheetRemoveNode
  | GoogleSheetsV4SheetUpdateNode
  ;