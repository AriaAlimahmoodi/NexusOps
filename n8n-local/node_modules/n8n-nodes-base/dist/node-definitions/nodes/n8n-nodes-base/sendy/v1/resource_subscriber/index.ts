/**
 * Sendy - Subscriber Resource
 * Re-exports all operation types for this resource.
 */

import type { SendyV1SubscriberAddNode } from './operation_add';
import type { SendyV1SubscriberCountNode } from './operation_count';
import type { SendyV1SubscriberDeleteNode } from './operation_delete';
import type { SendyV1SubscriberRemoveNode } from './operation_remove';
import type { SendyV1SubscriberStatusNode } from './operation_status';

export * from './operation_add';
export * from './operation_count';
export * from './operation_delete';
export * from './operation_remove';
export * from './operation_status';

export type SendyV1SubscriberNode =
  | SendyV1SubscriberAddNode
  | SendyV1SubscriberCountNode
  | SendyV1SubscriberDeleteNode
  | SendyV1SubscriberRemoveNode
  | SendyV1SubscriberStatusNode
  ;