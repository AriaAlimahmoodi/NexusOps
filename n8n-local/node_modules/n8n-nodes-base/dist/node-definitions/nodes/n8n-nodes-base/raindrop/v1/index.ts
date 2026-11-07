/**
 * Raindrop Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { RaindropV1BookmarkNode } from './resource_bookmark';
import type { RaindropV1CollectionNode } from './resource_collection';
import type { RaindropV1TagNode } from './resource_tag';
import type { RaindropV1UserNode } from './resource_user';

export * from './resource_bookmark';
export * from './resource_collection';
export * from './resource_tag';
export * from './resource_user';

export type RaindropV1Node =
  | RaindropV1BookmarkNode
  | RaindropV1CollectionNode
  | RaindropV1TagNode
  | RaindropV1UserNode
  ;