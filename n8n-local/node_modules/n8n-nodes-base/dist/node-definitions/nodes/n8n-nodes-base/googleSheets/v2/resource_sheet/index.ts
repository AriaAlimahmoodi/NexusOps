/**
 * Google Sheets  - Sheet Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleSheetsV2SheetAppendNode } from './operation_append';
import type { GoogleSheetsV2SheetClearNode } from './operation_clear';
import type { GoogleSheetsV2SheetCreateNode } from './operation_create';
import type { GoogleSheetsV2SheetDeleteNode } from './operation_delete';
import type { GoogleSheetsV2SheetLookupNode } from './operation_lookup';
import type { GoogleSheetsV2SheetReadNode } from './operation_read';
import type { GoogleSheetsV2SheetRemoveNode } from './operation_remove';
import type { GoogleSheetsV2SheetUpdateNode } from './operation_update';
import type { GoogleSheetsV2SheetUpsertNode } from './operation_upsert';

export * from './operation_append';
export * from './operation_clear';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_lookup';
export * from './operation_read';
export * from './operation_remove';
export * from './operation_update';
export * from './operation_upsert';

export type GoogleSheetsV2SheetNode =
  | GoogleSheetsV2SheetAppendNode
  | GoogleSheetsV2SheetClearNode
  | GoogleSheetsV2SheetCreateNode
  | GoogleSheetsV2SheetDeleteNode
  | GoogleSheetsV2SheetLookupNode
  | GoogleSheetsV2SheetReadNode
  | GoogleSheetsV2SheetRemoveNode
  | GoogleSheetsV2SheetUpdateNode
  | GoogleSheetsV2SheetUpsertNode
  ;