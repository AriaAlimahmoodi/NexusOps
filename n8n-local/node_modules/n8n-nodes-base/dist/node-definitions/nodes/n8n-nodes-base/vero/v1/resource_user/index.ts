/**
 * Vero - User Resource
 * Re-exports all operation types for this resource.
 */

import type { VeroV1UserAddTagsNode } from './operation_add_tags';
import type { VeroV1UserAliasNode } from './operation_alias';
import type { VeroV1UserCreateNode } from './operation_create';
import type { VeroV1UserDeleteNode } from './operation_delete';
import type { VeroV1UserRemoveTagsNode } from './operation_remove_tags';
import type { VeroV1UserResubscribeNode } from './operation_resubscribe';
import type { VeroV1UserUnsubscribeNode } from './operation_unsubscribe';

export * from './operation_add_tags';
export * from './operation_alias';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_remove_tags';
export * from './operation_resubscribe';
export * from './operation_unsubscribe';

export type VeroV1UserNode =
  | VeroV1UserAddTagsNode
  | VeroV1UserAliasNode
  | VeroV1UserCreateNode
  | VeroV1UserDeleteNode
  | VeroV1UserRemoveTagsNode
  | VeroV1UserResubscribeNode
  | VeroV1UserUnsubscribeNode
  ;