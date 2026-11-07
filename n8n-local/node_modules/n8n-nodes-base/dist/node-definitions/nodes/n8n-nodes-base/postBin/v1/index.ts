/**
 * PostBin Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PostBinV1BinNode } from './resource_bin';
import type { PostBinV1RequestNode } from './resource_request';

export * from './resource_bin';
export * from './resource_request';

export type PostBinV1Node =
  | PostBinV1BinNode
  | PostBinV1RequestNode
  ;