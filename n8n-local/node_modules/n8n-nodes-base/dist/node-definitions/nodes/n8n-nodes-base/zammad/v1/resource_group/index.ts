/**
 * Zammad - Group Resource
 * Re-exports all operation types for this resource.
 */

import type { ZammadV1GroupCreateNode } from './operation_create';
import type { ZammadV1GroupDeleteNode } from './operation_delete';
import type { ZammadV1GroupGetNode } from './operation_get';
import type { ZammadV1GroupGetAllNode } from './operation_get_all';
import type { ZammadV1GroupUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ZammadV1GroupNode =
  | ZammadV1GroupCreateNode
  | ZammadV1GroupDeleteNode
  | ZammadV1GroupGetNode
  | ZammadV1GroupGetAllNode
  | ZammadV1GroupUpdateNode
  ;