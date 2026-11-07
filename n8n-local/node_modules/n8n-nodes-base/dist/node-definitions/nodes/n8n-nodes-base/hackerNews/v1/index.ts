/**
 * Hacker News Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { HackerNewsV1AllNode } from './resource_all';
import type { HackerNewsV1ArticleNode } from './resource_article';
import type { HackerNewsV1UserNode } from './resource_user';

export * from './resource_all';
export * from './resource_article';
export * from './resource_user';

export type HackerNewsV1Node =
  | HackerNewsV1AllNode
  | HackerNewsV1ArticleNode
  | HackerNewsV1UserNode
  ;