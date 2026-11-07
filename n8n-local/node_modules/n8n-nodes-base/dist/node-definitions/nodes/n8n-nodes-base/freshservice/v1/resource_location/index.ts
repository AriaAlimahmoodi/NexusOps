/**
 * Freshservice - Location Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1LocationCreateNode } from './operation_create';
import type { FreshserviceV1LocationDeleteNode } from './operation_delete';
import type { FreshserviceV1LocationGetNode } from './operation_get';
import type { FreshserviceV1LocationGetAllNode } from './operation_get_all';
import type { FreshserviceV1LocationUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1LocationNode =
  | FreshserviceV1LocationCreateNode
  | FreshserviceV1LocationDeleteNode
  | FreshserviceV1LocationGetNode
  | FreshserviceV1LocationGetAllNode
  | FreshserviceV1LocationUpdateNode
  ;