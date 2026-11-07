/**
 * HaloPSA - Client Resource
 * Re-exports all operation types for this resource.
 */

import type { HaloPSAV1ClientCreateNode } from './operation_create';
import type { HaloPSAV1ClientDeleteNode } from './operation_delete';
import type { HaloPSAV1ClientGetNode } from './operation_get';
import type { HaloPSAV1ClientGetAllNode } from './operation_get_all';
import type { HaloPSAV1ClientUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HaloPSAV1ClientNode =
  | HaloPSAV1ClientCreateNode
  | HaloPSAV1ClientDeleteNode
  | HaloPSAV1ClientGetNode
  | HaloPSAV1ClientGetAllNode
  | HaloPSAV1ClientUpdateNode
  ;