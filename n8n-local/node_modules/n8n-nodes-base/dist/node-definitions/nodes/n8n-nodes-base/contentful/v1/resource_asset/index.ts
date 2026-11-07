/**
 * Contentful - Asset Resource
 * Re-exports all operation types for this resource.
 */

import type { ContentfulV1AssetGetNode } from './operation_get';
import type { ContentfulV1AssetGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type ContentfulV1AssetNode =
  | ContentfulV1AssetGetNode
  | ContentfulV1AssetGetAllNode
  ;