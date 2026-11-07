/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV45SheetAppendNode } from './operation_append';
import type { GoogleSheetsV45SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV45SheetClearNode } from './operation_clear';
import type { GoogleSheetsV45SheetCreateNode } from './operation_create';
import type { GoogleSheetsV45SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV45SheetReadNode } from './operation_read';
import type { GoogleSheetsV45SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV45SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV45SheetNode =
  | GoogleSheetsV45SheetAppendNode
  | GoogleSheetsV45SheetAppendOrUpdateNode
  | GoogleSheetsV45SheetClearNode
  | GoogleSheetsV45SheetCreateNode
  | GoogleSheetsV45SheetDeleteNode
  | GoogleSheetsV45SheetReadNode
  | GoogleSheetsV45SheetRemoveNode
  | GoogleSheetsV45SheetUpdateNode
  ;