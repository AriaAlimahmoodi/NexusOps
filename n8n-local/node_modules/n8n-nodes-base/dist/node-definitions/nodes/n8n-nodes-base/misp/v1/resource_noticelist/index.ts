/**
 * MISP - Noticelist Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1NoticelistGetNode } from './operation_get';
import type { MispV1NoticelistGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type MispV1NoticelistNode =
  | MispV1NoticelistGetNode
  | MispV1NoticelistGetAllNode
  ;