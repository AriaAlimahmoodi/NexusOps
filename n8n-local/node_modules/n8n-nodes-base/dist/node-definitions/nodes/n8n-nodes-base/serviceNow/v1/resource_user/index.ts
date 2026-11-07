/**
 * ServiceNow - User Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1UserCreateNode } from './operation_create';
import type { ServiceNowV1UserDeleteNode } from './operation_delete';
import type { ServiceNowV1UserGetNode } from './operation_get';
import type { ServiceNowV1UserGetAllNode } from './operation_get_all';
import type { ServiceNowV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ServiceNowV1UserNode =
  | ServiceNowV1UserCreateNode
  | ServiceNowV1UserDeleteNode
  | ServiceNowV1UserGetNode
  | ServiceNowV1UserGetAllNode
  | ServiceNowV1UserUpdateNode
  ;