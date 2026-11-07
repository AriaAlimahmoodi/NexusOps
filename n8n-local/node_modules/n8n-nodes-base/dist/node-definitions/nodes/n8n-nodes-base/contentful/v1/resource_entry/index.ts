/**
 * Contentful - Entry Resource
 * Re-exports all operation types for this resource.
 */

import type { ContentfulV1EntryGetNode } from './operation_get';
import type { ContentfulV1EntryGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type ContentfulV1EntryNode =
  | ContentfulV1EntryGetNode
  | ContentfulV1EntryGetAllNode
  ;