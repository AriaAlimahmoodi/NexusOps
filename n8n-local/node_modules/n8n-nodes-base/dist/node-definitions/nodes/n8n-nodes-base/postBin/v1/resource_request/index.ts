/**
 * PostBin - Request Resource
 * Re-exports all operation types for this resource.
 */

import type { PostBinV1RequestGetNode } from './operation_get';
import type { PostBinV1RequestRemoveFirstNode } from './operation_remove_first';
import type { PostBinV1RequestSendNode } from './operation_send';

export * from './operation_get';
export * from './operation_remove_first';
export * from './operation_send';

export type PostBinV1RequestNode =
  | PostBinV1RequestGetNode
  | PostBinV1RequestRemoveFirstNode
  | PostBinV1RequestSendNode
  ;