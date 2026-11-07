/**
 * Wordpress Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { WordpressV1PostNode } from './resource_post';
import type { WordpressV1PageNode } from './resource_page';
import type { WordpressV1UserNode } from './resource_user';

export * from './resource_post';
export * from './resource_page';
export * from './resource_user';

export type WordpressV1Node =
  | WordpressV1PostNode
  | WordpressV1PageNode
  | WordpressV1UserNode
  ;