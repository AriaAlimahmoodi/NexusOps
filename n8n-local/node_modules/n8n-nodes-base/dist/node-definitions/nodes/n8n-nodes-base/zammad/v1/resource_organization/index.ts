/**
 * Zammad - Organization Resource
 * Re-exports all operation types for this resource.
 */

import type { ZammadV1OrganizationCreateNode } from './operation_create';
import type { ZammadV1OrganizationDeleteNode } from './operation_delete';
import type { ZammadV1OrganizationGetNode } from './operation_get';
import type { ZammadV1OrganizationGetAllNode } from './operation_get_all';
import type { ZammadV1OrganizationUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ZammadV1OrganizationNode =
  | ZammadV1OrganizationCreateNode
  | ZammadV1OrganizationDeleteNode
  | ZammadV1OrganizationGetNode
  | ZammadV1OrganizationGetAllNode
  | ZammadV1OrganizationUpdateNode
  ;