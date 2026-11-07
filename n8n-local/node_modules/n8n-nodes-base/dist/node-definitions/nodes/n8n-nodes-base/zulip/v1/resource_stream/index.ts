/**
 * Zulip - Stream Resource
 * Re-exports all operation types for this resource.
 */

import type { ZulipV1StreamCreateNode } from './operation_create';
import type { ZulipV1StreamDeleteNode } from './operation_delete';
import type { ZulipV1StreamGetAllNode } from './operation_get_all';
import type { ZulipV1StreamGetSubscribedNode } from './operation_get_subscribed';
import type { ZulipV1StreamUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_get_subscribed';
export * from './operation_update';

export type ZulipV1StreamNode =
  | ZulipV1StreamCreateNode
  | ZulipV1StreamDeleteNode
  | ZulipV1StreamGetAllNode
  | ZulipV1StreamGetSubscribedNode
  | ZulipV1StreamUpdateNode
  ;