/**
 * Google Sheets - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV3SheetAppendNode } from './operation_append';
import type { GoogleSheetsV3SheetAppendOrUpdateNode } from './operation_append_or_update';
import type { GoogleSheetsV3SheetClearNode } from './operation_clear';
import type { GoogleSheetsV3SheetCreateNode } from './operation_create';
import type { GoogleSheetsV3SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV3SheetReadNode } from './operation_read';
import type { GoogleSheetsV3SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV3SheetUpdateNode } from './operation_update';

export * from './operation_append';
export * from './operation_append_or_update';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';

export type GoogleSheetsV3SheetNode =
  | GoogleSheetsV3SheetAppendNode
  | GoogleSheetsV3SheetAppendOrUpdateNode
  | GoogleSheetsV3SheetClearNode
  | GoogleSheetsV3SheetCreateNode
  | GoogleSheetsV3SheetDeleteNode
  | GoogleSheetsV3SheetReadNode
  | GoogleSheetsV3SheetRemoveNode
  | GoogleSheetsV3SheetUpdateNode
  ;