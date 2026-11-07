/**
 * Freshservice - Change Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1ChangeCreateNode } from './operation_create';
import type { FreshserviceV1ChangeDeleteNode } from './operation_delete';
import type { FreshserviceV1ChangeGetNode } from './operation_get';
import type { FreshserviceV1ChangeGetAllNode } from './operation_get_all';
import type { FreshserviceV1ChangeUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1ChangeNode =
  | FreshserviceV1ChangeCreateNode
  | FreshserviceV1ChangeDeleteNode
  | FreshserviceV1ChangeGetNode
  | FreshserviceV1ChangeGetAllNode
  | FreshserviceV1ChangeUpdateNode
  ;