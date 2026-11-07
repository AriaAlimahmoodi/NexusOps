/**
 * Google Books Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { GoogleBooksV2BookshelfNode } from './resource_bookshelf';
import type { GoogleBooksV2BookshelfVolumeNode } from './resource_bookshelf_volume';
import type { GoogleBooksV2VolumeNode } from './resource_volume';

export * from './resource_bookshelf';
export * from './resource_bookshelf_volume';
export * from './resource_volume';

export type GoogleBooksV2Node =
  | GoogleBooksV2BookshelfNode
  | GoogleBooksV2BookshelfVolumeNode
  | GoogleBooksV2VolumeNode
  ;