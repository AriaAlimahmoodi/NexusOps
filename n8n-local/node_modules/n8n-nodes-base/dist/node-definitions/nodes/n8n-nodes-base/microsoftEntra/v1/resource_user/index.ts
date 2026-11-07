/**
 * Microsoft Entra ID - User Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftEntraV1UserAddGroupNode } from './operation_add_group';
import type { MicrosoftEntraV1UserCreateNode } from './operation_create';
import type { MicrosoftEntraV1UserDeleteNode } from './operation_delete';
import type { MicrosoftEntraV1UserGetNode } from './operation_get';
import type { MicrosoftEntraV1UserGetAllNode } from './operation_get_all';
import type { MicrosoftEntraV1UserRemoveGroupNode } from './operation_remove_group';
import type { MicrosoftEntraV1UserUpdateNode } from './operation_update';

export * from './operation_add_group';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove_group';
export * from './operation_update';

export type MicrosoftEntraV1UserNode =
  | MicrosoftEntraV1UserAddGroupNode
  | MicrosoftEntraV1UserCreateNode
  | MicrosoftEntraV1UserDeleteNode
  | MicrosoftEntraV1UserGetNode
  | MicrosoftEntraV1UserGetAllNode
  | MicrosoftEntraV1UserRemoveGroupNode
  | MicrosoftEntraV1UserUpdateNode
  ;