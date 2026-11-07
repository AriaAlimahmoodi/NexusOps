/**
 * Hacker News - Article Resource
 * Re-exports all operation types for this resource.
 */

import type { HackerNewsV1ArticleGetNode } from './operation_get';

export * from './operation_get';

export type HackerNewsV1ArticleNode = HackerNewsV1ArticleGetNode;