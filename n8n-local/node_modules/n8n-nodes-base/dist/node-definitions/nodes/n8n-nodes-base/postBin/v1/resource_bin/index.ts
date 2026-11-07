/**
 * PostBin - Bin Resource
 * Re-exports all operation types for this resource.
 */

import type { PostBinV1BinCreateNode } from './operation_create';
import type { PostBinV1BinDeleteNode } from './operation_delete';
import type { PostBinV1BinGetNode } from './operation_get';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';

export type PostBinV1BinNode =
  | PostBinV1BinCreateNode
  | PostBinV1BinDeleteNode
  | PostBinV1BinGetNode
  ;