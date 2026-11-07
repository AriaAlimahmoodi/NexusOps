/**
 * Google Business Profile - Post Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBusinessProfileV1PostCreateNode } from './operation_create';
import type { GoogleBusinessProfileV1PostDeleteNode } from './operation_delete';
import type { GoogleBusinessProfileV1PostGetNode } from './operation_get';
import type { GoogleBusinessProfileV1PostGetAllNode } from './operation_get_all';
import type { GoogleBusinessProfileV1PostUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleBusinessProfileV1PostNode =
  | GoogleBusinessProfileV1PostCreateNode
  | GoogleBusinessProfileV1PostDeleteNode
  | GoogleBusinessProfileV1PostGetNode
  | GoogleBusinessProfileV1PostGetAllNode
  | GoogleBusinessProfileV1PostUpdateNode
  ;