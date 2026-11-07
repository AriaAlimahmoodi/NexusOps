/**
 * Freshservice - Product Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1ProductCreateNode } from './operation_create';
import type { FreshserviceV1ProductDeleteNode } from './operation_delete';
import type { FreshserviceV1ProductGetNode } from './operation_get';
import type { FreshserviceV1ProductGetAllNode } from './operation_get_all';
import type { FreshserviceV1ProductUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1ProductNode =
  | FreshserviceV1ProductCreateNode
  | FreshserviceV1ProductDeleteNode
  | FreshserviceV1ProductGetNode
  | FreshserviceV1ProductGetAllNode
  | FreshserviceV1ProductUpdateNode
  ;