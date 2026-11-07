/**
 * Raindrop - Bookmark Resource
 * Re-exports all operation types for this resource.
 */

import type { RaindropV1BookmarkCreateNode } from './operation_create';
import type { RaindropV1BookmarkDeleteNode } from './operation_delete';
import type { RaindropV1BookmarkGetNode } from './operation_get';
import type { RaindropV1BookmarkGetAllNode } from './operation_get_all';
import type { RaindropV1BookmarkUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type RaindropV1BookmarkNode =
  | RaindropV1BookmarkCreateNode
  | RaindropV1BookmarkDeleteNode
  | RaindropV1BookmarkGetNode
  | RaindropV1BookmarkGetAllNode
  | RaindropV1BookmarkUpdateNode
  ;