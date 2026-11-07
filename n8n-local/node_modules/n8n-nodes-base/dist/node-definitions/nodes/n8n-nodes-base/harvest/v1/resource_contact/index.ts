/**
 * Harvest - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { HarvestV1ContactCreateNode } from './operation_create';
import type { HarvestV1ContactDeleteNode } from './operation_delete';
import type { HarvestV1ContactGetNode } from './operation_get';
import type { HarvestV1ContactGetAllNode } from './operation_get_all';
import type { HarvestV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HarvestV1ContactNode =
  | HarvestV1ContactCreateNode
  | HarvestV1ContactDeleteNode
  | HarvestV1ContactGetNode
  | HarvestV1ContactGetAllNode
  | HarvestV1ContactUpdateNode
  ;