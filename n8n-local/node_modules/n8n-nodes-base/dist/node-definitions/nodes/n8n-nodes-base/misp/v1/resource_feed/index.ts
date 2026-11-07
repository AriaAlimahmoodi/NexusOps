/**
 * MISP - Feed Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1FeedCreateNode } from './operation_create';
import type { MispV1FeedDisableNode } from './operation_disable';
import type { MispV1FeedEnableNode } from './operation_enable';
import type { MispV1FeedGetNode } from './operation_get';
import type { MispV1FeedGetAllNode } from './operation_get_all';
import type { MispV1FeedUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MispV1FeedNode =
  | MispV1FeedCreateNode
  | MispV1FeedDisableNode
  | MispV1FeedEnableNode
  | MispV1FeedGetNode
  | MispV1FeedGetAllNode
  | MispV1FeedUpdateNode
  ;