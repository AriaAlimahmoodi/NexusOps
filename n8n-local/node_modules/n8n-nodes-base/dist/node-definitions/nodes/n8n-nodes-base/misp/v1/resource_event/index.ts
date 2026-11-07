/**
 * MISP - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1EventCreateNode } from './operation_create';
import type { MispV1EventDeleteNode } from './operation_delete';
import type { MispV1EventGetNode } from './operation_get';
import type { MispV1EventGetAllNode } from './operation_get_all';
import type { MispV1EventPublishNode } from './operation_publish';
import type { MispV1EventSearchNode } from './operation_search';
import type { MispV1EventUnpublishNode } from './operation_unpublish';
import type { MispV1EventUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_publish';
export * from './operation_search';
export * from './operation_unpublish';
export * from './operation_update';

export type MispV1EventNode =
  | MispV1EventCreateNode
  | MispV1EventDeleteNode
  | MispV1EventGetNode
  | MispV1EventGetAllNode
  | MispV1EventPublishNode
  | MispV1EventSearchNode
  | MispV1EventUnpublishNode
  | MispV1EventUpdateNode
  ;