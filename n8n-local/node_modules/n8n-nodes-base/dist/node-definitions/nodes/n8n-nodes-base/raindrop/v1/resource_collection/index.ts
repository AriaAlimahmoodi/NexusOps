/**
 * Raindrop - Collection Resource
 * Re-exports all operation types for this resource.
 */

import type { RaindropV1CollectionCreateNode } from './operation_create';
import type { RaindropV1CollectionDeleteNode } from './operation_delete';
import type { RaindropV1CollectionGetNode } from './operation_get';
import type { RaindropV1CollectionGetAllNode } from './operation_get_all';
import type { RaindropV1CollectionUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type RaindropV1CollectionNode =
  | RaindropV1CollectionCreateNode
  | RaindropV1CollectionDeleteNode
  | RaindropV1CollectionGetNode
  | RaindropV1CollectionGetAllNode
  | RaindropV1CollectionUpdateNode
  ;