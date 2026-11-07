/**
 * Google Books Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleBooksV1BookshelfNode } from './resource_bookshelf';
import type { GoogleBooksV1BookshelfVolumeNode } from './resource_bookshelf_volume';
import type { GoogleBooksV1VolumeNode } from './resource_volume';

export * from './resource_bookshelf';
export * from './resource_bookshelf_volume';
export * from './resource_volume';

export type GoogleBooksV1Node =
  | GoogleBooksV1BookshelfNode
  | GoogleBooksV1BookshelfVolumeNode
  | GoogleBooksV1VolumeNode
  ;