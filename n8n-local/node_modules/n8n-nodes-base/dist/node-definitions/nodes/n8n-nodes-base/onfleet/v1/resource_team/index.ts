/**
 * Onfleet - Team Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1TeamAutoDispatchNode } from './operation_auto_dispatch';
import type { OnfleetV1TeamCreateNode } from './operation_create';
import type { OnfleetV1TeamDeleteNode } from './operation_delete';
import type { OnfleetV1TeamGetNode } from './operation_get';
import type { OnfleetV1TeamGetAllNode } from './operation_get_all';
import type { OnfleetV1TeamGetTimeEstimatesNode } from './operation_get_time_estimates';
import type { OnfleetV1TeamUpdateNode } from './operation_update';

export * from './operation_auto_dispatch';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_time_estimates';
export * from './operation_update';

export type OnfleetV1TeamNode =
  | OnfleetV1TeamAutoDispatchNode
  | OnfleetV1TeamCreateNode
  | OnfleetV1TeamDeleteNode
  | OnfleetV1TeamGetNode
  | OnfleetV1TeamGetAllNode
  | OnfleetV1TeamGetTimeEstimatesNode
  | OnfleetV1TeamUpdateNode
  ;