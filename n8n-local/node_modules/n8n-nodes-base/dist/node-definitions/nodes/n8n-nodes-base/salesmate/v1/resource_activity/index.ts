/**
 * Salesmate - Activity Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesmateV1ActivityCreateNode } from './operation_create';
import type { SalesmateV1ActivityDeleteNode } from './operation_delete';
import type { SalesmateV1ActivityGetNode } from './operation_get';
import type { SalesmateV1ActivityGetAllNode } from './operation_get_all';
import type { SalesmateV1ActivityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SalesmateV1ActivityNode =
  | SalesmateV1ActivityCreateNode
  | SalesmateV1ActivityDeleteNode
  | SalesmateV1ActivityGetNode
  | SalesmateV1ActivityGetAllNode
  | SalesmateV1ActivityUpdateNode
  ;