/**
 * Freshservice - RequesterGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1RequesterGroupCreateNode } from './operation_create';
import type { FreshserviceV1RequesterGroupDeleteNode } from './operation_delete';
import type { FreshserviceV1RequesterGroupGetNode } from './operation_get';
import type { FreshserviceV1RequesterGroupGetAllNode } from './operation_get_all';
import type { FreshserviceV1RequesterGroupUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1RequesterGroupNode =
  | FreshserviceV1RequesterGroupCreateNode
  | FreshserviceV1RequesterGroupDeleteNode
  | FreshserviceV1RequesterGroupGetNode
  | FreshserviceV1RequesterGroupGetAllNode
  | FreshserviceV1RequesterGroupUpdateNode
  ;