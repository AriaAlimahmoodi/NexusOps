/**
 * Freshservice - Requester Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1RequesterCreateNode } from './operation_create';
import type { FreshserviceV1RequesterDeleteNode } from './operation_delete';
import type { FreshserviceV1RequesterGetNode } from './operation_get';
import type { FreshserviceV1RequesterGetAllNode } from './operation_get_all';
import type { FreshserviceV1RequesterUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1RequesterNode =
  | FreshserviceV1RequesterCreateNode
  | FreshserviceV1RequesterDeleteNode
  | FreshserviceV1RequesterGetNode
  | FreshserviceV1RequesterGetAllNode
  | FreshserviceV1RequesterUpdateNode
  ;