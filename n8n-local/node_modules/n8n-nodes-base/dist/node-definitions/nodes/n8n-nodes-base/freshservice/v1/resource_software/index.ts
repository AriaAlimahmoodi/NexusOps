/**
 * Freshservice - Software Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1SoftwareCreateNode } from './operation_create';
import type { FreshserviceV1SoftwareDeleteNode } from './operation_delete';
import type { FreshserviceV1SoftwareGetNode } from './operation_get';
import type { FreshserviceV1SoftwareGetAllNode } from './operation_get_all';
import type { FreshserviceV1SoftwareUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1SoftwareNode =
  | FreshserviceV1SoftwareCreateNode
  | FreshserviceV1SoftwareDeleteNode
  | FreshserviceV1SoftwareGetNode
  | FreshserviceV1SoftwareGetAllNode
  | FreshserviceV1SoftwareUpdateNode
  ;