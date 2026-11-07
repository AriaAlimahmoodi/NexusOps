/**
 * Google Books - Bookshelf Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBooksV2BookshelfGetNode } from './operation_get';
import type { GoogleBooksV2BookshelfGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GoogleBooksV2BookshelfNode =
  | GoogleBooksV2BookshelfGetNode
  | GoogleBooksV2BookshelfGetAllNode
  ;