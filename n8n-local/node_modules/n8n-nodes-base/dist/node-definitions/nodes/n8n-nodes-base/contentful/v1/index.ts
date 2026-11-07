/**
 * Contentful Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ContentfulV1AssetNode } from './resource_asset';
import type { ContentfulV1ContentTypeNode } from './resource_content_type';
import type { ContentfulV1EntryNode } from './resource_entry';
import type { ContentfulV1LocaleNode } from './resource_locale';
import type { ContentfulV1SpaceNode } from './resource_space';

export * from './resource_asset';
export * from './resource_content_type';
export * from './resource_entry';
export * from './resource_locale';
export * from './resource_space';

export type ContentfulV1Node =
  | ContentfulV1AssetNode
  | ContentfulV1ContentTypeNode
  | ContentfulV1EntryNode
  | ContentfulV1LocaleNode
  | ContentfulV1SpaceNode
  ;