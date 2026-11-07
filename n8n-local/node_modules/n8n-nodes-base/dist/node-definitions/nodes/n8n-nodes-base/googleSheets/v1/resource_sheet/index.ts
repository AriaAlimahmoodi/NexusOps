/**
 * Google Sheets  - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV1SheetAppendNode } from './operation_append';
import type { GoogleSheetsV1SheetClearNode } from './operation_clear';
import type { GoogleSheetsV1SheetCreateNode } from './operation_create';
import type { GoogleSheetsV1SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV1SheetLookupNode } from './operation_lookup';
import type { GoogleSheetsV1SheetReadNode } from './operation_read';
import type { GoogleSheetsV1SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV1SheetUpdateNode } from './operation_update';
import type { GoogleSheetsV1SheetUpsertNode } from './operation_upsert';

export * from './operation_append';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_lookup';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';
export * from './operation_upsert';

export type GoogleSheetsV1SheetNode =
  | GoogleSheetsV1SheetAppendNode
  | GoogleSheetsV1SheetClearNode
  | GoogleSheetsV1SheetCreateNode
  | GoogleSheetsV1SheetDeleteNode
  | GoogleSheetsV1SheetLookupNode
  | GoogleSheetsV1SheetReadNode
  | GoogleSheetsV1SheetRemoveNode
  | GoogleSheetsV1SheetUpdateNode
  | GoogleSheetsV1SheetUpsertNode
  ;