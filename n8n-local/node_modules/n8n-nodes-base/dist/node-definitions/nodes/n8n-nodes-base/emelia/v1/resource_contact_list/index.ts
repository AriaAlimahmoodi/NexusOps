/**
 * Emelia - ContactList Resource
 * Re-exports all operation types for this resource.
 */

import type { EmeliaV1ContactListAddNode } from './operation_add';
import type { EmeliaV1ContactListGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_get_all';

export type EmeliaV1ContactListNode =
  | EmeliaV1ContactListAddNode
  | EmeliaV1ContactListGetAllNode
  ;