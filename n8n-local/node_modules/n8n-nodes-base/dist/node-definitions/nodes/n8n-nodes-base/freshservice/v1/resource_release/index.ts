/**
 * Freshservice - Release Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1ReleaseCreateNode } from './operation_create';
import type { FreshserviceV1ReleaseDeleteNode } from './operation_delete';
import type { FreshserviceV1ReleaseGetNode } from './operation_get';
import type { FreshserviceV1ReleaseGetAllNode } from './operation_get_all';
import type { FreshserviceV1ReleaseUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1ReleaseNode =
  | FreshserviceV1ReleaseCreateNode
  | FreshserviceV1ReleaseDeleteNode
  | FreshserviceV1ReleaseGetNode
  | FreshserviceV1ReleaseGetAllNode
  | FreshserviceV1ReleaseUpdateNode
  ;