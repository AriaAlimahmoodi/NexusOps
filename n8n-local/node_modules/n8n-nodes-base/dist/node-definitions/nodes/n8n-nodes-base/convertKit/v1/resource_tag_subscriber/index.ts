/**
 * ConvertKit - TagSubscriber Resource
 * Re-exports all operation types for this resource.
 */

import type { ConvertKitV1TagSubscriberAddNode } from './operation_add';
import type { ConvertKitV1TagSubscriberDeleteNode } from './operation_delete';
import type { ConvertKitV1TagSubscriberGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type ConvertKitV1TagSubscriberNode =
  | ConvertKitV1TagSubscriberAddNode
  | ConvertKitV1TagSubscriberDeleteNode
  | ConvertKitV1TagSubscriberGetAllNode
  ;