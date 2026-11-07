/**
 * Onfleet - Admin Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1AdminCreateNode } from './operation_create';
import type { OnfleetV1AdminDeleteNode } from './operation_delete';
import type { OnfleetV1AdminGetAllNode } from './operation_get_all';
import type { OnfleetV1AdminUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type OnfleetV1AdminNode =
  | OnfleetV1AdminCreateNode
  | OnfleetV1AdminDeleteNode
  | OnfleetV1AdminGetAllNode
  | OnfleetV1AdminUpdateNode
  ;