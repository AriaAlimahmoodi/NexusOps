/**
 * Google Books - Bookshelf Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBooksV1BookshelfGetNode } from './operation_get';
import type { GoogleBooksV1BookshelfGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GoogleBooksV1BookshelfNode =
  | GoogleBooksV1BookshelfGetNode
  | GoogleBooksV1BookshelfGetAllNode
  ;