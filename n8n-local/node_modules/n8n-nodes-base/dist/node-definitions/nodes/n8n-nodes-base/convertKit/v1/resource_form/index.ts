/**
 * ConvertKit - Form Resource
 * Re-exports all operation types for this resource.
 */

import type { ConvertKitV1FormAddSubscriberNode } from './operation_add_subscriber';
import type { ConvertKitV1FormGetAllNode } from './operation_get_all';
import type { ConvertKitV1FormGetSubscriptionsNode } from './operation_get_subscriptions';

export * from './operation_add_subscriber';
export * from './operation_get_all';
export * from './operation_get_subscriptions';

export type ConvertKitV1FormNode =
  | ConvertKitV1FormAddSubscriberNode
  | ConvertKitV1FormGetAllNode
  | ConvertKitV1FormGetSubscriptionsNode
  ;