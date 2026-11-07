/**
 * Freshservice - Department Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1DepartmentCreateNode } from './operation_create';
import type { FreshserviceV1DepartmentDeleteNode } from './operation_delete';
import type { FreshserviceV1DepartmentGetNode } from './operation_get';
import type { FreshserviceV1DepartmentGetAllNode } from './operation_get_all';
import type { FreshserviceV1DepartmentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1DepartmentNode =
  | FreshserviceV1DepartmentCreateNode
  | FreshserviceV1DepartmentDeleteNode
  | FreshserviceV1DepartmentGetNode
  | FreshserviceV1DepartmentGetAllNode
  | FreshserviceV1DepartmentUpdateNode
  ;